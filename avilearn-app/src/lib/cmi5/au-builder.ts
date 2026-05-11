interface Cmi5AUOptions {
  auId: string;
  title: string;
  description?: string;
  launchUrl: string;
  moveOn?: 'Passed' | 'Completed' | 'CompletedAndPassed' | 'CompletedOrPassed' | 'NotApplicable';
  masteryScore?: number;
}

export function buildCmi5Xml(aus: Cmi5AUOptions[]): string {
  const auEntries = aus
    .map((au) => {
      const moveOn = au.moveOn || 'CompletedOrPassed';
      const mastery = au.masteryScore !== undefined
        ? `\n      <masteryScore>${au.masteryScore}</masteryScore>`
        : '';
      return `    <au id="${escapeXml(au.auId)}" moveOn="${moveOn}" launchUrl="${escapeXml(au.launchUrl)}">
      <title>
        <langstring lang="en-US">${escapeXml(au.title)}</langstring>
      </title>
      <description>
        <langstring lang="en-US">${escapeXml(au.description || au.title)}</langstring>
      </description>${mastery}
    </au>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<courseStructure xmlns="https://w3id.org/xapi/profiles/cmi5/v1/CourseStructure.xsd">
  <course id="avilearn-course">
    <title>
      <langstring lang="en-US">AviLearn Course Package</langstring>
    </title>
    <description>
      <langstring lang="en-US">AI-generated aviation training content</langstring>
    </description>
  </course>
${auEntries}
</courseStructure>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
