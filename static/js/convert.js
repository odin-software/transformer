const mainArea = document.querySelector("main");
const backdrop = document.getElementById("backdrop");
const progress = document.getElementById("progress");
const fileList = document.getElementById("file-list");
const errorP = document.getElementById("error");
/** @type {HTMLSelectElement|null} */
// @ts-ignore
const selectType = document.getElementById("file-select");

/** @type {string[]} */
const converted = [];

backdrop?.addEventListener("drop", handleDrop, false);

function handleDrop(event) {
  const dt = event.dataTransfer;
  const toSend = [...dt.files];
  handleFiles(toSend);
}

function handleFiles(files) {
  converted.length = 0;
  showprogress();
  unshowerror();
  if (Array.isArray(files)) {
    Promise.all(files.map((f) => uploadFile(f))).then(() => {
      generateConvertList();
      unshowprogress();
      showlist();
    });
    return;
  }
  Promise.all([...files].map((f) => uploadFile(f))).then(() => {
    generateConvertList();
    unshowprogress();
    showlist();
  });
}

function generateConvertList() {
  if (fileList) {
    fileList.innerHTML = "";
  }
  converted.forEach((url) => {
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
  const typeTo = selectType?.value || "webp";
  const url = `/convert/${typeTo}`;
  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  if (res.status === 500) {
    showerror();
    unshowlist();
    return;
  }
  const text = await res.text();
  converted.push(text);
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

function showprogress() {
  progress?.classList.add("show");
}

function showlist() {
  fileList?.classList.add("show");
}

function showerror() {
  errorP?.classList.add("show");
}

function unshow(_e) {
  backdrop?.classList.remove("show");
}

function unshowprogress() {
  progress?.classList.remove("show");
}

function unshowlist() {
  fileList?.classList.remove("show");
}

function unshowerror() {
  errorP?.classList.remove("show");
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}
