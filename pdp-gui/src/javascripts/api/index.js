import { currentIdentity } from "../lib/identity";
import spinner from "../lib/spin";

const apiPath = "/pdp/api";

function apiUrl(path) {
  return apiPath + path;
}

function validateResponse(res) {
  spinner.stop();

  if (!res.ok) {
    const error = new Error(res.statusText);
    error.response = res;
    throw error;
  }

  return res;
}

export function parseJson(res) {
  return res.json();
}

function validFetch(path, options) {
  const contentHeaders = {
    "Accept": "application/json",
    "Content-Type": "application/json"
  };

  let identityHeaders = {};
  if (currentIdentity) {
    identityHeaders = {
      "X-IDP-ENTITY-ID": currentIdentity.idpEntityId,
      "X-UNSPECIFIED-NAME-ID": currentIdentity.unspecifiedNameId,
      "X-DISPLAY-NAME": currentIdentity.displayName,
      "X-IMPERSONATE": true
    };
  }

  const fetchOptions = _.merge({}, { headers: { ...contentHeaders, ...identityHeaders } }, options);

  spinner.start();
  return fetch(apiUrl(path), fetchOptions)
  .catch(err => {
    spinner.stop();
    throw err;
  })
  .then(validateResponse);
}

export function fetchJson(path, options = {}) {
  return validFetch(path, options)
  .then(parseJson);
}

export function getUserData() {
  return fetchJson("/internal/users/me");
}

export function getIdentityProviders() {
  return fetchJson("/internal/identityProviders");
}
