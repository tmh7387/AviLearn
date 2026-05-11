import { createClient } from '@/lib/supabase/server';
import { logAgentDecision, timer } from './logger';

interface PackageInput {
  simulationId: string;
  moduleId: string;
  moduleTitle: string;
  htmlCode: string;
  simType: string;
}

export async function packageSimulationAsCmi5(input: PackageInput): Promise<string> {
  const elapsed = timer();
  const supabase = await createClient();

  // Generate the cmi5 AU wrapper
  const cmi5Html = wrapInCmi5AU(input.htmlCode, input.moduleTitle, input.simType);
  const fileName = `sim_${input.simulationId}_v1.html`;
  const storagePath = `simulations/${input.moduleId}/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('scorm-packages')
    .upload(storagePath, new Blob([cmi5Html], { type: 'text/html' }), {
      contentType: 'text/html',
      upsert: true,
    });

  if (uploadError) {
    console.error('[Packager] Upload failed:', uploadError);
    throw new Error(`Failed to upload simulation: ${uploadError.message}`);
  }

  // Update simulation record
  await supabase
    .from('generated_simulations')
    .update({ cmi5_package_path: storagePath })
    .eq('id', input.simulationId);

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'packager',
    action: 'package_cmi5_au',
    inputSummary: `Sim: ${input.simulationId}, Type: ${input.simType}`,
    outputSummary: `Uploaded to ${storagePath}`,
    durationMs: ms,
    relatedModuleId: input.moduleId,
  });

  return storagePath;
}

function wrapInCmi5AU(htmlCode: string, title: string, simType: string): string {
  // Inject cmi5 message bridge into the HTML
  const cmi5Bridge = `
<script>
  // cmi5 AU Bridge — communicates with LMS via postMessage
  (function() {
    var launched = false;
    function sendStatement(verb, score, success) {
      window.parent.postMessage({
        type: 'xapi',
        verb: verb,
        score: score || null,
        success: success || null,
        timestamp: new Date().toISOString(),
        actor: { name: 'learner' },
        object: {
          id: 'urn:avilearn:sim:${simType}',
          definition: {
            name: { 'en-US': '${title.replace(/'/g, "\\'")}' },
            type: 'http://adlnet.gov/expapi/activities/simulation'
          }
        }
      }, '*');
    }
    if (!launched) {
      sendStatement('launched');
      launched = true;
    }
    window.cmi5 = { sendStatement: sendStatement };
  })();
</script>`;

  // Insert bridge before closing </head> or </body>
  if (htmlCode.includes('</head>')) {
    return htmlCode.replace('</head>', cmi5Bridge + '\n</head>');
  }
  return htmlCode.replace('</body>', cmi5Bridge + '\n</body>');
}
