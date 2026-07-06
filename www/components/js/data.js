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
          localStorage.setItem("userID", result.userID);
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
  document.getElementById('homeName').textContent = localStorage.getItem('fullname');
}

// Change name profile
if (window.location.pathname.includes("user.html")) {
  document.getElementById('user_us').textContent = localStorage.getItem('username');
  document.getElementById('user_name').textContent = localStorage.getItem('fullname');
  document.getElementById('date_Crt').textContent = localStorage.getItem('memSince');
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// Fetch moment
if (window.location.pathname.includes("history.html")) {

  const userID = localStorage.getItem('userID');
  const historyContainer = document.getElementById('historyList');

  if (!userID) {
    historyContainer.innerHTML = `<div class="text-center text-muted mt-4">Please log in to see your history.</div>`;
  } else {
    historyContainer.innerHTML = `<div class="text-center text-muted mt-4">Loading your moments...</div>`;

    fetch(serverUrl + `/getact.php?userID=${userID}`)
      .then(response => response.json())
      .then(result => {
        historyContainer.innerHTML = '';

        if (result.status === "success") {
          window.momentsData = result.data;

          result.data.forEach(moment => {
            const cardHTML = `
                        <div class="card border-1 shadow-sm rounded-4 overflow-hidden" data-momentid="${moment.momentid}">
                            <div class="card-body p-3 d-flex justify-content-between align-items-center">
                                <h6 class="card-title fw-bold mb-0 text-truncate pe-3">${moment.placename}</h6>
                                <div class="d-flex gap-2 flex-shrink-0">
                                    <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill view-btn">View</button>
                                    <button type="button" class="btn btn-sm btn-outline-primary rounded-pill edit-btn">Edit</button>
                                    <button type="button" class="btn btn-sm btn-outline-danger rounded-pill delete-btn">Delete</button>
                                </div>
                            </div>
                        </div>
                        `;
            historyContainer.innerHTML += cardHTML;
          });
        } else if (result.status === "empty") {
          historyContainer.innerHTML = `<div class="text-center text-muted mt-4">No moments saved yet. Go explore!</div>`;
        } else {
          historyContainer.innerHTML = `<div class="text-center text-danger mt-4">Error: ${result.message}</div>`;
        }
      })
      .catch(error => {
        console.error("Fetch Error:", error);
        historyContainer.innerHTML = `<div class="text-center text-danger mt-4">Failed to connect to server.</div>`;
      });
  }

  // Click Listener
  historyContainer.addEventListener('click', function (e) {
    const card = e.target.closest('.card');
    if (!card) return;

    const momentId = card.getAttribute('data-momentid');
    const moment = window.momentsData.find(m => m.momentid == momentId);

    if (e.target.classList.contains('view-btn')) {
      viewMoment(moment);
    } else if (e.target.classList.contains('edit-btn')) {
      editMoment(moment);
    } else if (e.target.classList.contains('delete-btn')) {
      deleteMoment(momentId, card);
    }
  });
}

// View moment
function viewMoment(moment) {
  Swal.fire({
    title: moment.placename,
    html: `
        <div class="mb-3">
            <img src="${serverUrl}/${moment.momentfilepath}" class="img-fluid rounded" style="max-height: 250px; object-fit: cover;" alt="Moment Image">
        </div>
        <p class="text-muted mb-1"><span class="badge text-bg-secondary">${moment.types}</span></p>
        <p class="mb-0 fs-6"><strong>"${moment.caption || 'No caption'}"</strong></p>
        <p class="small text-muted mt-3 mb-0">Saved on: ${moment.datecreated}</p>
    `,
    confirmButtonText: 'Close',
    confirmButtonColor: '#6c757d',
    customClass: { popup: 'rounded-4 border-0 shadow' }
  });
}
// Edit moment
function editMoment(moment) {
  Swal.fire({
    title: 'Edit Caption',
    input: 'text',
    inputValue: moment.caption || '',
    showCancelButton: true,
    confirmButtonText: 'Update',
    confirmButtonColor: '#0d6efd',
    customClass: { popup: 'rounded-4 border-0 shadow' },
    preConfirm: (newCaption) => {
      if (!newCaption.trim()) {
        Swal.showValidationMessage('Caption cannot be empty!');
        return false;
      }
      return newCaption;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      let formData = new FormData();
      formData.append('momentid', moment.momentid);
      formData.append('caption', result.value);
      formData.append('userid', localStorage.getItem('userID'));

      fetch(serverUrl + '/edit_moment.php', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            Swal.fire({
              title: 'Updated!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            }).then(() => location.reload()); // Reload to show new text
          } else {
            Swal.fire('Error', data.message, 'error');
          }
        });
    }
  });
}

// Delete moment
function deleteMoment(momentId, cardElement) {
  Swal.fire({
    title: 'Delete this moment?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
    customClass: { popup: 'rounded-4 border-0 shadow' }
  }).then((result) => {
    if (result.isConfirmed) {
      let formData = new FormData();
      formData.append('momentid', momentId);
      formData.append('userid', localStorage.getItem('userID'));

      fetch(serverUrl + '/delete_moment.php', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            Swal.fire({
              title: 'Deleted!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            cardElement.remove();
          } else {
            Swal.fire('Error', data.message, 'error');
          }
        });
    }
  });
}