import sys
import json
import os
import base64
import io

try:
    from pptx import Presentation
    from pptx.util import Emu
    from pptx.enum.shapes import MSO_SHAPE_TYPE
    from pptx.dml.color import RGBColor
except ImportError:
    print(json.dumps({
        "error": "Missing dependency 'python-pptx'. Please install it using 'pip install python-pptx'."
    }))
    sys.exit(1)

# Max image size to inline as base64 (2 MB)
MAX_IMAGE_BYTES = 2 * 1024 * 1024


def emu_to_px(emu_val):
    """Convert EMU (English Metric Units) to approximate pixels (96 DPI)."""
    if emu_val is None:
        return 0
    return round(int(emu_val) / 914400 * 96)


def get_fill_color(shape):
    """Attempt to extract a solid fill color from a shape. Returns hex string or None."""
    try:
        fill = shape.fill
        if fill is not None and fill.type is not None:
            # Solid fill
            fore_color = fill.fore_color
            if fore_color and fore_color.type is not None:
                rgb = fore_color.rgb
                if rgb:
                    return f"#{rgb}"
    except Exception:
        pass
    return None


def extract_image_base64(picture_shape):
    """Extract image from a picture shape as a base64 data URI."""
    try:
        image = picture_shape.image
        blob = image.blob
        content_type = image.content_type  # e.g., 'image/png', 'image/jpeg'

        if len(blob) > MAX_IMAGE_BYTES:
            return None  # Skip oversized images

        b64 = base64.b64encode(blob).decode('utf-8')
        return {
            "base64": f"data:{content_type};base64,{b64}",
            "width": emu_to_px(picture_shape.width),
            "height": emu_to_px(picture_shape.height),
            "contentType": content_type,
            "sizeBytes": len(blob),
        }
    except Exception:
        return None


def extract_table(shape):
    """Extract table data as a list of rows, each row a list of cell strings."""
    try:
        table = shape.table
        rows = []
        for row in table.rows:
            cells = []
            for cell in row.cells:
                cells.append(cell.text.strip())
            rows.append(cells)
        return {"rows": rows}
    except Exception:
        return None


def extract_shape_info(shape, group_id=None):
    """Extract metadata from a non-text, non-image shape (AutoShapes, freeforms, etc.)."""
    info = {
        "name": shape.name or "",
        "type": "auto_shape",
        "shapeId": shape.shape_id,
        "left": emu_to_px(shape.left),
        "top": emu_to_px(shape.top),
        "width": emu_to_px(shape.width),
        "height": emu_to_px(shape.height),
    }

    # Fill color
    fill_color = get_fill_color(shape)
    if fill_color:
        info["fillColor"] = fill_color

    # Text inside the shape
    if shape.has_text_frame:
        text = shape.text_frame.text.strip()
        if text:
            info["text"] = text

    # Group membership
    if group_id:
        info["groupId"] = group_id

    return info


def process_group_shape(group_shape, shapes_list, images_list, img_counter):
    """Recursively process a GroupShape, tagging children with a group ID."""
    group_id = f"group_{group_shape.shape_id}"

    for shape in group_shape.shapes:
        shape_type = None
        try:
            shape_type = shape.shape_type
        except Exception:
            pass

        if shape_type == MSO_SHAPE_TYPE.GROUP:
            # Nested group
            img_counter = process_group_shape(shape, shapes_list, images_list, img_counter)
        elif shape_type == MSO_SHAPE_TYPE.PICTURE:
            img_data = extract_image_base64(shape)
            if img_data:
                img_counter += 1
                img_id = f"img_{img_counter}"
                images_list.append({
                    "id": img_id,
                    "altText": shape.name or f"image_{img_counter}",
                    "groupId": group_id,
                    **img_data,
                })
        elif shape_type == MSO_SHAPE_TYPE.TABLE:
            pass  # Tables inside groups are rare, skip
        else:
            shape_info = extract_shape_info(shape, group_id=group_id)
            shapes_list.append(shape_info)

    return img_counter


def parse_pptx(file_path):
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)

    try:
        prs = Presentation(file_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to open presentation: {str(e)}"}))
        sys.exit(1)

    slides_data = []
    global_img_counter = 0

    for index, slide in enumerate(prs.slides):
        title = ""
        text_content = []
        has_images = False
        has_charts = False
        images = []
        shapes = []
        tables = []

        # Try to find a title shape
        if slide.shapes.title:
            title = slide.shapes.title.text.strip()

        for shape in slide.shapes:
            shape_type = None
            try:
                shape_type = shape.shape_type
            except Exception:
                pass

            # --- Group shapes (may contain diagrams, pyramids, etc.) ---
            if shape_type == MSO_SHAPE_TYPE.GROUP:
                global_img_counter = process_group_shape(
                    shape, shapes, images, global_img_counter
                )
                has_images = has_images or len(images) > 0
                continue

            # --- Pictures ---
            if shape_type == MSO_SHAPE_TYPE.PICTURE:
                has_images = True
                img_data = extract_image_base64(shape)
                if img_data:
                    global_img_counter += 1
                    img_id = f"img_{global_img_counter}"
                    images.append({
                        "id": img_id,
                        "altText": shape.name or f"image_{global_img_counter}",
                        **img_data,
                    })
                continue

            # --- Charts ---
            if shape_type == MSO_SHAPE_TYPE.CHART:
                has_charts = True
                continue

            # --- Tables ---
            if shape.has_table:
                has_charts = True  # Keep legacy flag for backwards compat
                table_data = extract_table(shape)
                if table_data:
                    tables.append(table_data)
                continue

            # --- Text frames ---
            if shape.has_text_frame:
                text = shape.text_frame.text.strip()
                if text and text != title:
                    text_content.append(text)

            # --- Auto shapes, freeforms, connectors (potential diagram parts) ---
            if shape_type in (
                MSO_SHAPE_TYPE.AUTO_SHAPE,
                MSO_SHAPE_TYPE.FREEFORM,
                MSO_SHAPE_TYPE.TEXT_BOX,
            ):
                # Only record shapes that have visual significance
                # (i.e., have a fill color or are part of a visual element)
                fill_color = get_fill_color(shape)
                shape_text = ""
                if shape.has_text_frame:
                    shape_text = shape.text_frame.text.strip()

                if fill_color or (shape_text and shape_type != MSO_SHAPE_TYPE.TEXT_BOX):
                    shape_info = extract_shape_info(shape)
                    shapes.append(shape_info)

        # Extract notes
        notes = ""
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes = slide.notes_slide.notes_text_frame.text.strip()

        slide_obj = {
            "index": index + 1,
            "title": title or f"Slide {index + 1}",
            "textContent": "\n".join(text_content),
            "hasImages": has_images,
            "hasCharts": has_charts,
            "notes": notes,
        }

        # Only include non-empty arrays to keep output clean
        if images:
            slide_obj["images"] = images
        if shapes:
            slide_obj["shapes"] = shapes
        if tables:
            slide_obj["tables"] = tables

        slides_data.append(slide_obj)

    print(json.dumps({"slides": slides_data}))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python parse_pptx.py <path_to_pptx>"}))
        sys.exit(1)

    parse_pptx(sys.argv[1])
