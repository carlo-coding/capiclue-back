const $ = (s) => document.querySelector(s);

const resetPasswordEndpoint = '/api/v1/auth/reset-password';

async function checkError(response, codeMessages) {
  if (response.status >= 200 && response.status <= 299) {
    return await response.json();
  } else {
    const errorText =
      codeMessages?.[response.status] !== undefined
        ? codeMessages[response.status]
        : response.statusText;
    throw Error(errorText);
  }
}

const $form = $('#reset-password-form');

const $password = $('#password');

const $repeatPassword = $('#repeat-password');

$password.onchange = function (e) {
  $repeatPassword.setAttribute('pattern', e.currentTarget.value);
};

function showSnackbar(msg = 'yup', type = 'success') {
  const $snackar = $(`.snackbar.${type}`);
  $snackar.textContent = msg;
  $snackar.classList.remove('hidden');
  setTimeout(() => {
    $snackar.classList.add('hidden');
  }, 1000 * 5);
}

$form.onsubmit = async function (e) {
  e.preventDefault();

  const password = $password.value;
  const urlSearchParams = new Proxy(
    new URLSearchParams(window.location.search),
    {
      get: (searchParams, prop) => searchParams.get(prop),
    },
  );
  const token = urlSearchParams.token;
  const email = urlSearchParams.email;

  if (!token || !email) {
    showSnackbar('El token no es válido', 'error');
    return;
  }

  try {
    const response = await fetch(resetPasswordEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password, email }),
    });
    await checkError(response, {
      400: 'Contraseña no aceptada por el servidor',
      401: 'El token ha expirado',
    });
    showSnackbar('Contraseña cambiada con éxito', 'success');
  } catch (err) {
    showSnackbar(err.message, 'error');
  }
};
