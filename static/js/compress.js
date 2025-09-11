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

    // Parse JSON response (new async format)
    const jobResponse = await res.json();

    // Start polling for job status
    pollJobStatus(jobResponse.job_id, file.name);

  } catch (error) {
    showErrorMessage("Network error - please check your connection", 0);
    unshowlist();
  }
}

// Poll job status until completion
async function pollJobStatus(jobId, originalFileName) {
  const maxPolls = 60; // Maximum 60 polls (5 minutes at 5-second intervals)
  let pollCount = 0;

  const poll = async () => {
    try {
      const res = await fetch(`/api/job/${jobId}`);
      if (!res.ok) {
        showErrorMessage("Failed to check job status", res.status);
        return;
      }

      const job = await res.json();
      updateJobProgress(jobId, job, originalFileName);

      // Continue polling if job is not finished
      if (job.status === 'pending' || job.status === 'processing') {
        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          showErrorMessage("Job timed out - please try again", 0);
        }
      } else if (job.status === 'completed') {
        // Job completed successfully
        compressed.push(job.output_file);
        convertProgressToDownload(jobId, job.output_file, originalFileName);
      } else if (job.status === 'failed') {
        // Job failed
        showErrorMessage(job.error_message || "Job processing failed", 0);
        removeJobProgress(jobId);
      }

    } catch (error) {
      showErrorMessage("Error checking job status", 0);
    }
  };

  // Start polling
  poll();
}

// Track active jobs for progress display
const activeJobs = new Map();

// Update job progress in UI
function updateJobProgress(jobId, job, originalFileName) {
  if (!activeJobs.has(jobId)) {
    // Create progress item
    const progressItem = createProgressItem(jobId, originalFileName, job.status);
    activeJobs.set(jobId, progressItem);

    // Show progress list if not already visible
    showlist();
  } else {
    // Update existing progress item
    const progressItem = activeJobs.get(jobId);
    updateProgressItem(progressItem, job.status);
  }
}

// Create progress item element
function createProgressItem(jobId, fileName, status) {
  const li = document.createElement('li');
  li.className = 'job-progress';
  li.dataset.jobId = jobId;

  li.innerHTML = `
    <div class="job-info">
      <span class="job-filename">${fileName}</span>
      <span class="job-status">${getStatusText(status)}</span>
    </div>
    <div class="job-progress-bar">
      <div class="job-progress-fill ${status}"></div>
    </div>
  `;

  fileList?.appendChild(li);
  return li;
}

// Update progress item status
function updateProgressItem(progressItem, status) {
  const statusSpan = progressItem.querySelector('.job-status');
  const progressFill = progressItem.querySelector('.job-progress-fill');

  if (statusSpan) statusSpan.textContent = getStatusText(status);
  if (progressFill) {
    progressFill.className = `job-progress-fill ${status}`;
  }
}

// Convert progress item to download link
function convertProgressToDownload(jobId, outputFile, originalFileName) {
  const progressItem = activeJobs.get(jobId);
  if (progressItem) {
    // Show completed state briefly
    setTimeout(() => {
      // Create download link element
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${outputFile}" download="${originalFileName}">
          ${originalFileName}
        </a>
      `;

      progressItem.replaceWith(li);
      activeJobs.delete(jobId);

      generateCompressList();
    }, 2000);
  }
}

function removeJobProgress(jobId) {
  const progressItem = activeJobs.get(jobId);
  if (progressItem) {
    setTimeout(() => {
      progressItem.remove();
      activeJobs.delete(jobId);
    }, 3000);
  }
}

function getStatusText(status) {
  switch (status) {
    case 'pending': return 'Queued...';
    case 'processing': return 'Compressing...';
    case 'completed': return 'Completed ✓';
    case 'failed': return 'Failed ✗';
    default: return status;
  }
}
