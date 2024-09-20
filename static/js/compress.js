/** @type {HTMLSelectElement|null} */
// @ts-ignore
const selectType = document.getElementById("compress-select");
/** @type {string[]} */
const compressed = [];

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
  compressed.push(text);
}
