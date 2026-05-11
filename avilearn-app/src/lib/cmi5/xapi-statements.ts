import { v4 as uuidv4 } from 'uuid';

interface XapiActor {
  name: string;
  mbox?: string;
  account?: {
    homePage: string;
    name: string;
  };
}

interface XapiStatement {
  id: string;
  actor: {
    objectType: 'Agent';
    name: string;
    mbox?: string;
    account?: { homePage: string; name: string };
  };
  verb: {
    id: string;
    display: { 'en-US': string };
  };
  object: {
    objectType: 'Activity';
    id: string;
    definition: {
      name: { 'en-US': string };
      description?: { 'en-US': string };
      type: string;
    };
  };
  result?: {
    score?: { raw?: number; min?: number; max?: number; scaled?: number };
    success?: boolean;
    completion?: boolean;
    duration?: string;
  };
  timestamp: string;
}

const VERBS = {
  launched: { id: 'http://adlnet.gov/expapi/verbs/launched', display: 'launched' },
  initialized: { id: 'http://adlnet.gov/expapi/verbs/initialized', display: 'initialized' },
  completed: { id: 'http://adlnet.gov/expapi/verbs/completed', display: 'completed' },
  passed: { id: 'http://adlnet.gov/expapi/verbs/passed', display: 'passed' },
  failed: { id: 'http://adlnet.gov/expapi/verbs/failed', display: 'failed' },
  terminated: { id: 'http://adlnet.gov/expapi/verbs/terminated', display: 'terminated' },
} as const;

export type XapiVerb = keyof typeof VERBS;

export function createStatement(
  verb: XapiVerb,
  actor: XapiActor,
  activityId: string,
  activityName: string,
  result?: XapiStatement['result']
): XapiStatement {
  const v = VERBS[verb];
  return {
    id: uuidv4(),
    actor: {
      objectType: 'Agent',
      name: actor.name,
      ...(actor.mbox && { mbox: actor.mbox }),
      ...(actor.account && { account: actor.account }),
    },
    verb: {
      id: v.id,
      display: { 'en-US': v.display },
    },
    object: {
      objectType: 'Activity',
      id: activityId,
      definition: {
        name: { 'en-US': activityName },
        type: 'http://adlnet.gov/expapi/activities/lesson',
      },
    },
    ...(result && { result }),
    timestamp: new Date().toISOString(),
  };
}

export function launchStatement(actor: XapiActor, activityId: string, activityName: string) {
  return createStatement('launched', actor, activityId, activityName);
}

export function completedStatement(actor: XapiActor, activityId: string, activityName: string, duration?: string) {
  return createStatement('completed', actor, activityId, activityName, {
    completion: true,
    ...(duration && { duration }),
  });
}

export function passedStatement(actor: XapiActor, activityId: string, activityName: string, score: number, max = 100) {
  return createStatement('passed', actor, activityId, activityName, {
    success: true,
    completion: true,
    score: { raw: score, max, min: 0, scaled: score / max },
  });
}

export function failedStatement(actor: XapiActor, activityId: string, activityName: string, score: number, max = 100) {
  return createStatement('failed', actor, activityId, activityName, {
    success: false,
    completion: true,
    score: { raw: score, max, min: 0, scaled: score / max },
  });
}

export { VERBS };
