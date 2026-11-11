"""
Render a Kestrel Pacific .blend model as a technical line drawing for Stage.

Needs Blender's Python module: pip install bpy==5.3.0 (Python 3.13).
Usage:
  python scripts/kestrel-render.py -- <model.blend> <side|three-quarter|top|front> <tech|photo|livery> <light|dark> <out.png> [x|y] [1|-1]
  arg 6: the fuselage axis of the model (A321neo: x, 787-9: y)
  arg 7: +1 when the nose points to +axis, -1 when it does not (787-9 three-quarter: -1)
Output: transparent PNG, navy lines on white (light) or light lines on navy (dark).
Copy results to public/stage/kestrel/ as <name>-light.png and <name>-dark.png.
"livery" keeps the model's own materials. It needs the textures/ folder next to the .blend file.
"""
import bpy, sys, math, mathutils, json
argv = sys.argv[sys.argv.index('--')+1:]
blend, view, style, theme, out = argv[:5]
axis = argv[5] if len(argv)>5 else 'x'   # fuselage axis
flip = float(argv[6]) if len(argv)>6 else 1.0  # +1: nose toward +axis
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
# remove lights and cameras
for o in list(bpy.data.objects):
    if o.type in ('LIGHT','CAMERA'): bpy.data.objects.remove(o, do_unlink=True)
meshes=[o for o in sc.objects if o.type=='MESH' and not o.hide_render]
mn=mathutils.Vector((1e9,)*3); mx=mathutils.Vector((-1e9,)*3)
for o in meshes:
    for c in o.bound_box:
        w=o.matrix_world@mathutils.Vector(c)
        for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
ctr=(mn+mx)/2; size=mx-mn
TOK={'light':{'fill':(1,1,1),'line':(0x12/255,0x30/255,0x5a/255),'paint':(0.92,0.93,0.95)},
     'dark':{'fill':(0.16,0.26,0.37),'line':(0xb9/255,0xca/255,0xdc/255),'paint':(0.92,0.93,0.95)}}[theme]
def srgb2lin(c): return tuple(((v+0.055)/1.055)**2.4 if v>0.04045 else v/12.92 for v in c)
# material override
m=bpy.data.materials.new('ovr'); m.use_nodes=True
p=m.node_tree.nodes['Principled BSDF']
if style=='tech':
    p.inputs['Base Color'].default_value=(*srgb2lin(TOK['fill']),1); p.inputs['Roughness'].default_value=1.0
else:
    p.inputs['Base Color'].default_value=(*srgb2lin(TOK['paint']),1); p.inputs['Roughness'].default_value=0.32
    p.inputs['Coat Weight'].default_value=0.3
for o in (meshes if style!='livery' else []):
    o.data.materials.clear(); o.data.materials.append(m)
# world
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
bg=w.node_tree.nodes['Background']
if style=='tech':
    bg.inputs['Color'].default_value=(1,1,1,1); bg.inputs['Strength'].default_value=0.9
else:
    sky=w.node_tree.nodes.new('ShaderNodeTexSky')
    try: sky.sky_type='NISHITA'
    except Exception: pass
    w.node_tree.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value=0.35
sun=bpy.data.lights.new('sun','SUN'); sun.energy=2.2 if style=='tech' else 4.0; sun.angle=math.radians(8)
so=bpy.data.objects.new('sun',sun); sc.collection.objects.link(so)
so.rotation_euler=(math.radians(40),math.radians(15),math.radians(30))
# axes
L = 0 if axis=='x' else 1   # length axis index
S = 1 if axis=='x' else 0   # span axis
def vec(l,s,z):
    v=[0,0,0]; v[L]=l; v[S]=s; v[2]=z; return mathutils.Vector(v)
cam=bpy.data.cameras.new('c'); co=bpy.data.objects.new('c',cam); sc.collection.objects.link(co); sc.camera=co
cam.type='ORTHO'
if view=='side':   d=vec(0,-1,0)
elif view=='top':  d=vec(0,0,1)
elif view=='front':d=vec(flip,0,0)
else:              d=vec(flip*0.62,-0.78,0.38)
d.normalize()
R=size.length*2
co.location=ctr+d*R
up=vec(flip,0,0) if view=='top' else mathutils.Vector((0,0,1))
co.rotation_euler=(-d).to_track_quat('-Z','Y').to_euler()
if view=='top':
    import mathutils as mu
    co.rotation_euler=(mu.Matrix.Rotation(math.radians(90),4,'Z')@co.matrix_world.to_3x3().to_4x4()).to_euler() if False else co.rotation_euler
bpy.context.view_layer.update()
inv=co.matrix_world.inverted()
pts=[]
for o in meshes:
    for c in o.bound_box:
        pts.append(inv@(o.matrix_world@mathutils.Vector(c)))
x0=min(p.x for p in pts); x1=max(p.x for p in pts); y0=min(p.y for p in pts); y1=max(p.y for p in pts)
W=x1-x0; H=y1-y0
RX=1600; RY=max(300,min(1000,int(RX*H/W*1.12)+2))
cam.ortho_scale=max(W*1.06, H*1.06*RX/RY)
co.location=co.matrix_world@mathutils.Vector(((x0+x1)/2,(y0+y1)/2,0))
cam.clip_end=10000
r=sc.render
r.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=24 if style=='tech' else 64
sc.cycles.use_denoising=True
r.resolution_x=RX; r.resolution_y=RY; r.resolution_percentage=100
r.film_transparent=True
r.image_settings.file_format='PNG'; r.image_settings.color_mode='RGBA'
sc.view_settings.view_transform='AgX' if style=='livery' else 'Standard'
if style=='livery':
    try: sc.view_settings.look='AgX - Medium High Contrast'
    except Exception: pass
if style=='tech':
    r.use_freestyle=True; r.line_thickness_mode='ABSOLUTE'; r.line_thickness=2.2
    vl=sc.view_layers[0]; vl.use_freestyle=True
    fs=vl.freestyle_settings; fs.crease_angle=math.radians(150)
    ls=fs.linesets[0] if fs.linesets else fs.linesets.new('ls')
    ls.select_by_visibility=True; ls.select_by_edge_types=True
    ls.select_silhouette=True; ls.select_border=True; ls.select_crease=True; ls.select_contour=True; ls.select_external_contour=True
    ls.linestyle.color=srgb2lin(TOK['line']); ls.linestyle.thickness=2.2
elif style=='photo':
    # shadow catcher ground
    bpy.ops.mesh.primitive_plane_add(size=size.length*4, location=(ctr.x,ctr.y,mn.z))
    bpy.context.active_object.is_shadow_catcher=True
r.filepath=out
bpy.ops.render.render(write_still=True)
print('DONE',out,[round(v,1) for v in size])
