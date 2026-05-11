interface ScormManifestOptions {
  courseId: string;
  courseTitle: string;
  organizationId?: string;
  resources: {
    id: string;
    href: string;
    type?: string;
    files: string[];
  }[];
}

export function buildImsManifest(options: ScormManifestOptions): string {
  const orgId = options.organizationId || `org-${options.courseId}`;

  const resourcesXml = options.resources
    .map((r) => {
      const filesXml = r.files.map((f) => `        <file href="${escapeXml(f)}" />`).join('\n');
      return `      <resource identifier="${escapeXml(r.id)}" type="${r.type || 'webcontent'}" adlcp:scormtype="sco" href="${escapeXml(r.href)}">
${filesXml}
      </resource>`;
    })
    .join('\n');

  const itemsXml = options.resources
    .map((r) => `        <item identifier="item-${escapeXml(r.id)}" identifierref="${escapeXml(r.id)}">
          <title>${escapeXml(r.href)}</title>
        </item>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="manifest-${escapeXml(options.courseId)}"
  version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${escapeXml(orgId)}">
    <organization identifier="${escapeXml(orgId)}">
      <title>${escapeXml(options.courseTitle)}</title>
${itemsXml}
    </organization>
  </organizations>
  <resources>
${resourcesXml}
  </resources>
</manifest>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
