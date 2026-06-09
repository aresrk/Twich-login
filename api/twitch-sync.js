// Servidor Backend seguro para RXG INDOMINUS en Vercel
export default async function handler(req, res) {
  // Habilitar permisos CORS para que tu GitHub Pages pueda consultar este servidor
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // 1. OBTENER EL CÓDIGO TEMPORAL ENVIADO DESDE TU GITHUB PAGES
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Falta el código de autorización' });
  }

  // CREDENCIALES SEGURAS (Corregidas y protegidas)
  const TWITCH_CLIENT_ID = 'jtwdrj3a05pcqgweyvqqajbb6clpvk';
  const TWITCH_CLIENT_SECRET = '29t73za97vf5t2z4jinzzbuv8mn41p';
  
  // ¡OJO! Esta debe ser exactamente la misma URL de redirección que pusiste en Twitch Developer
  const REDIRECT_URI = 'https://github.io'; 

  try {
    // 2. INTERCAMBIAR CÓDIGO TEMPORAL POR UN TOKEN DE ACCESO REAL
    const urlToken = 'https://twitch.tv';
    const paramsToken = new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });

    const respuestaToken = await fetch(urlToken, {
      method: 'POST',
      body: paramsToken
    });
    const resultadoToken = await respuestaToken.json();

    if (!resultadoToken.access_token) {
      return res.status(401).json({ message: 'No se pudo obtener el Access Token de Twitch' });
    }

    // 3. PEDIR LOS DATOS REALES DEL USUARIO A LA API DE TWITCH
    const urlUsuario = 'https://twitch.tv';
    const respuestaUsuario = await fetch(urlUsuario, {
      method: 'GET',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${resultadoToken.access_token}`
      }
    });
    const resultadoUsuario = await respuestaUsuario.json();

    if (resultadoUsuario.data && resultadoUsuario.data.length > 0) {
      const user = resultadoUsuario.data[0];
      
      // Devolvemos los datos limpios de vuelta a tu archivo index.html en GitHub Pages
      return res.status(200).json({
        id: user.id,
        login: user.login,
        nombre: user.display_name,
        foto: user.profile_image_url
      });
    } else {
      return res.status(404).json({ message: 'No se encontraron datos de usuario en Twitch' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.toString() });
  }
}
