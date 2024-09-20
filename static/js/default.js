const mainArea = document.querySelector("main");
const backdrop = document.getElementById("backdrop");
const progress = document.getElementById("progress");
const fileList = document.getElementById("file-list");
const errorP = document.getElementById("error");

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
