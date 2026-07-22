async function resolveUrl() {
  const url = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF0Q9VrQUEAvM10UJBJ9PaT67YGXcCssyhv4rJLuShMhlAb0KyuOMf7uFp0oNOFERHAKt8dg_1lS0sdOjDVpzDM1giyZk3iysvxTOF18HW1FhlwBRRS';
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log('Status:', res.status);
    console.log('Location:', res.headers.get('location'));
  } catch (err) {
    console.error(err);
  }
}
resolveUrl();
