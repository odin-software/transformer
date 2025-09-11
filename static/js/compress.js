/** @type {HTMLSelectElement|null} */
// @ts-ignore
const selectType = document.getElementById("compress-select");
/** @type {string[]} */
const compressed = [];

function showErrorMessage(message, statusCode) {
  const errorP = document.getElementById("error");
  if (!errorP) return;

  // Map status codes to user-friendly messages
  let displayMessage = message;
  switch (statusCode) {
    case 400:
      displayMessage = "Invalid file or compression setting - please check your upload";
      break;
    case 413:
      displayMessage = "File too large - maximum 50MB allowed";
      break;
    case 415:
      displayMessage = "Unsupported file type - only JPEG, PNG, WebP, and HEIC/HEIF are supported";
      break;
    case 500:
      displayMessage = "Server error - please try again";
      break;
    default:
      if (message && message.length > 0) {
        displayMessage = message;
      }
  }

  errorP.textContent = displayMessage;
  errorP.classList.add("show");

  // Auto-hide error after 5 seconds
  setTimeout(() => {
    errorP.classList.remove("show");
  }, 5000);
}

backdrop?.addEventListener("drop", handleDrop, false);

function handleDrop(event) {
  const dt = event.dataTransfer;
  const toSend = [...dt.files];
  handleFiles(toSend);
}

function handleFiles(files) {
  compressed.length = 0;
  showprogress();
  unshowerror();
  if (Array.isArray(files)) {
    Promise.all(files.map((f) => uploadFile(f))).then(() => {
      generateCompressList();
      unshowprogress();
      showlist();
    });
    return;
  }
  Promise.all([...files].map((f) => uploadFile(f))).then(() => {
    generateCompressList();
    unshowprogress();
    showlist();
  });
}

function generateCompressList() {
  if (fileList) {
    fileList.innerHTML = "";
  }
  compressed.forEach((url) => {
    const name = url.replace("files/done/", "");
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = url;
    a.download = "download";
    a.text = name;
    li.appendChild(a);
    fileList?.append(li);
  });
}

async function uploadFile(file) {
  const per = selectType?.value || "90";
  const url = `/compress`;
  const formData = new FormData();

  formData.append("file", file);
  formData.append("per", per);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      showErrorMessage(errorText, res.status);
      unshowlist();
      return;
    }

    const text = await res.text();
    compressed.push(text);
  } catch (error) {
    showErrorMessage("Network error - please check your connection", 0);
    unshowlist();
  }
}
