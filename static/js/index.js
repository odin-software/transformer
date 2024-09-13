const mainArea = document.querySelector("main");
const backdrop = document.getElementById("backdrop");
const submitButton = document.getElementById("submit-drop");
const fileList = document.getElementById("file-list");

if (submitButton) {
  submitButton.style.display = "none";
}

const files = [];

backdrop?.addEventListener("drop", handleDrop, false);

function handleDrop(event) {
  const dt = event.dataTransfer;
  const toSend = [...dt.files];
  handleFiles(toSend);

  const items = [...dt.items];
  items.forEach((item, i) => {
    if (item.kind === "file") {
      const file = item.getAsFile();
      const li = document.createElement("li");
      li.textContent = `${file?.name} - ${file?.size}`;
      fileList?.appendChild(li);
      files.push(file);
    }
  });
}

function handleFiles(files) {
  if (Array.isArray(files)) {
    files.forEach(uploadFile);
    return;
  }
  [...files].forEach(uploadFile);
}

function uploadFile(file) {
  const url = "/clasify";
  const formData = new FormData();

  formData.append("file", file);

  fetch(url, {
    method: "POST",
    body: formData,
  })
    .then(() => {})
    .catch(() => {});
}

/* Visual/Entry events */

["dragenter", "dragover", "dragleave", "drop"].forEach((event) => {
  backdrop?.addEventListener(event, preventDefaults, false);
});

["dragenter", "dragover"].forEach((event) => {
  mainArea?.addEventListener(event, show, false);
});

["dragenter", "dragover"].forEach((event) => {
  backdrop?.addEventListener(event, show, false);
});

["dragleave", "drop"].forEach((event) => {
  backdrop?.addEventListener(event, unshow, false);
});

function show(_e) {
  backdrop?.classList.add("show");
}

function unshow(_e) {
  backdrop?.classList.remove("show");
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}
