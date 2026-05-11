import JSZip from 'jszip';
import { buildImsManifest } from './manifest-builder';

interface PackageOptions {
  courseId: string;
  courseTitle: string;
  files: {
    path: string;
    content: string | Uint8Array;
  }[];
}

export async function buildScormPackage(options: PackageOptions): Promise<Uint8Array> {
  const zip = new JSZip();

  const resources = options.files.map((f, i) => ({
    id: `res-${i}`,
    href: f.path,
    files: [f.path],
  }));

  const manifest = buildImsManifest({
    courseId: options.courseId,
    courseTitle: options.courseTitle,
    resources,
  });

  zip.file('imsmanifest.xml', manifest);

  for (const file of options.files) {
    zip.file(file.path, file.content);
  }

  // Add SCORM API wrapper
  zip.file('scorm-api.js', SCORM_API_WRAPPER);

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

const SCORM_API_WRAPPER = `
// Minimal SCORM 1.2 API wrapper for LMS communication
(function() {
  var api = null;
  var findAttempts = 0;
  var maxAttempts = 500;

  function findAPI(win) {
    while (win.API == null && win.parent != null && win.parent != win) {
      findAttempts++;
      if (findAttempts > maxAttempts) return null;
      win = win.parent;
    }
    return win.API || null;
  }

  function getAPI() {
    if (api) return api;
    api = findAPI(window);
    if (!api && window.opener) api = findAPI(window.opener);
    return api;
  }

  window.ScormAPI = {
    initialize: function() {
      var a = getAPI();
      return a ? a.LMSInitialize("") : "false";
    },
    terminate: function() {
      var a = getAPI();
      return a ? a.LMSFinish("") : "false";
    },
    setValue: function(key, value) {
      var a = getAPI();
      return a ? a.LMSSetValue(key, value) : "false";
    },
    getValue: function(key) {
      var a = getAPI();
      return a ? a.LMSGetValue(key) : "";
    },
    commit: function() {
      var a = getAPI();
      return a ? a.LMSCommit("") : "false";
    },
    setComplete: function() {
      this.setValue("cmi.core.lesson_status", "completed");
      this.commit();
    },
    setPassed: function() {
      this.setValue("cmi.core.lesson_status", "passed");
      this.commit();
    },
    setFailed: function() {
      this.setValue("cmi.core.lesson_status", "failed");
      this.commit();
    },
    setScore: function(score, max, min) {
      this.setValue("cmi.core.score.raw", String(score));
      if (max !== undefined) this.setValue("cmi.core.score.max", String(max));
      if (min !== undefined) this.setValue("cmi.core.score.min", String(min));
      this.commit();
    }
  };
})();
`;
