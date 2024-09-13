const dropArea = document.querySelector("body");
console.log(dropArea);
const submitButton = document.getElementById("submit-drop");
if (submitButton) {
  submitButton.style.display = "none";
}
const files = [];

dropArea?.addEventListener("drop", handleDrop, false);

function handleDrop(event) {
  // const fileList = document.getElementById("file-list");
  const dt = event.dataTransfer;
  const toSend = [...dt.files];
  handleFiles(toSend);

  // const items = [...dt.items];
  // items.forEach((item, i) => {
  //   if (item.kind === "file") {
  //     const file = item.getAsFile();
  //     // console.log(file); // checking props
  //     const li = document.createElement("li");
  //     li.textContent = `file[${i}].name = ${file?.name}`;
  //     fileList?.appendChild(li);
  //     files.push(file);
  //   }
  // });
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
  dropArea?.addEventListener(event, preventDefaults, false);
});

["dragenter", "dragover"].forEach((event) => {
  dropArea?.addEventListener(event, highlight, false);
});

["dragleave", "drop"].forEach((event) => {
  dropArea?.addEventListener(event, removeHighlight, false);
});

function highlight(_e) {
  dropArea?.classList.add("highlight");
}

function removeHighlight(_e) {
  dropArea?.classList.remove("highlight");
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}
