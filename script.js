const formatFieldName = (name) =>
  name
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

document.querySelectorAll("[data-mailto-form]").forEach((form) => {
  const status = form.querySelector("[data-form-status]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      if (status) {
        status.textContent =
          "Please complete the required fields and confirm your agreement before submitting.";
      }
      return;
    }

    const lines = [form.dataset.formName || "Website form submission", ""];

    Array.from(form.elements).forEach((field) => {
      if (!field.name || field.disabled || field.type === "submit") {
        return;
      }

      if (field.type === "radio" && !field.checked) {
        return;
      }

      const label = field.dataset.label || formatFieldName(field.name);
      let value = field.value;

      if (field.type === "checkbox") {
        value = field.checked ? field.value || "Yes" : "No";
      }

      lines.push(`${label}: ${value || "N/A"}`);
    });

    const recipient = form.dataset.mailtoTo || "marty@martywilson.com";
    const subject = encodeURIComponent(
      form.dataset.mailtoSubject || "D'Iberville Fishing Rodeo Form Submission"
    );
    const body = encodeURIComponent(lines.join("\n"));

    if (status) {
      status.textContent =
        "Your email app is opening with a completed message. Send it to finish your submission.";
    }

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });
});

const modalTriggers = document.querySelectorAll("[data-modal-open]");
const modals = document.querySelectorAll("[data-modal]");

const closeModal = (modal) => {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
};

const openModal = (modal) => {
  modals.forEach((activeModal) => {
    if (activeModal !== modal) {
      activeModal.hidden = true;
    }
  });

  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector("[data-modal-close]")?.focus();
};

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modal = document.getElementById(trigger.dataset.modalOpen);

    if (modal) {
      openModal(modal);
    }
  });
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-modal-close]")) {
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  modals.forEach((modal) => {
    if (!modal.hidden) {
      closeModal(modal);
    }
  });
});
