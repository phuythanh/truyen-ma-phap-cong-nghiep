async function resolveUrl() {
  const url = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGfz04xgCfID5qVd1UehSlC1hG74dfgqtr_vEJP0wZAA3WUZRbYIFtHD9zCSyoDUnEsU1anWNH9pLV0_1K8g35PY9Fa-5nyZsRd1wrXEqJq5bc__K4NCDhSTgiRYYHb';
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log('Status:', res.status);
    console.log('Location:', res.headers.get('location'));
  } catch (err) {
    console.error(err);
  }
}
resolveUrl();
