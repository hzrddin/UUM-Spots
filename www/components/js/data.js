const serverUrl = window.APP_CONFIG.SERVER_URL;

// Login
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const usernameVal = document.getElementById('usernameInput').value.trim();
    const passwordVal = document.getElementById('passwordInput').value.trim();

    // Validation
    if (!usernameVal || !passwordVal) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter both your username and password.",
      });
      return;
    }

    let data = new FormData();
    data.append('username', usernameVal);
    data.append('password', passwordVal);

    fetch(serverUrl + '/login.php', {
      method: 'POST',
      body: data
    })
      .then(response => response.json())
      .then(result => {
        if (result.status === "success") {
          localStorage.setItem("username", result.username);
          localStorage.setItem("fullname", result.fullname);
          localStorage.setItem("memSince", result.date_created);
          window.location.href = 'home.html';
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: result.message,
          });
        }
      })
      .catch(error => {
        Swal.fire({
          icon: "error",
          title: "Fetch error",
          text: error.message
        });
      });
  });
}
// Signup
const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameVal = document.getElementById('regName').value.trim();
    const usVal = document.getElementById('regUsername').value.trim();
    const pwVal = document.getElementById('regPassword').value.trim();
    const isChecked = document.getElementById('invalidCheck').checked;

    if (!nameVal || !usVal || !pwVal) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please complete the registration form.",
      });
      return;
    }

    if (!isChecked) {
      Swal.fire({
        icon: "warning",
        title: "Terms Required",
        text: "Please accept the terms and conditions.",
      });
      return;
    }

    let data = new FormData();
    data.append('regName', nameVal);
    data.append('regUsername', usVal);
    data.append('regPassword', pwVal);

    fetch(serverUrl + '/signup.php', {
      method: 'POST',
      body: data
    })
      .then(response => response.json())
      .then(result => {
        if (result.status === "success") {
          Swal.fire({
            icon: "success",
            title: "Registration Successful",
            text: "You can now log in."
          }).then(() => {
            window.location.href = 'index.html';
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text: result.message,
          });
        }
      })
      .catch(error => {
        Swal.fire({
          icon: "error",
          title: "Fetch error",
          text: error.message
        });
      });
  });

}

// Change name home
if (window.location.pathname.includes("home.html")) {
  document.getElementById('homeName').textContent = localStorage.getItem('username');
}