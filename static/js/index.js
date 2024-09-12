const dropElement = document.getElementById("drop-area");
console.log(dropElement ?? "no");

dropElement?.addEventListener("drop", (event) => {
  event.preventDefault();
  const fileList = document.getElementById("file-list");
  if (event.dataTransfer?.items) {
    console.log("dt items");
    [...event.dataTransfer.items].forEach((item, i) => {
      if (item.kind === "file") {
        const file = item.getAsFile();
        console.log(file); // checking props
        var li = document.createElement("li");
        li.textContent = `file[${i}].name = ${file?.name}`;
        fileList?.appendChild(li);
      }
    });
  } else {
    console.log("dt files");
    [...(event.dataTransfer?.files ?? [])].forEach((file, i) => {
      console.log(`... file[${i}].name = ${file?.name}`);
    });
  }
  console.log("DragDrop");
});

/* Visual/Entry events */

dropElement?.addEventListener("dragenter", (event) => {
  console.log("DragEnter");
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
  dropElement.style.backgroundColor = "#BB8888";
});

dropElement?.addEventListener("dragover", (event) => {
  event.preventDefault();
  console.log("DragOver");
});

dropElement?.addEventListener("dragleave", (event) => {
  console.log("DragLeave");
  dropElement.style.backgroundColor = "white";
});
