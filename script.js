const formatFieldName = (name) =>
  name
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

document.querySelectorAll("[data-email-form]").forEach((form) => {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      if (status) {
        status.textContent =
          "Please complete the required fields and confirm your agreement before submitting.";
      }
      return;
    }

    const fields = [];

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

      fields.push({
        label,
        name: field.name,
        value: value || "N/A",
      });
    });

    if (status) {
      status.textContent = "Sending your submission...";
    }

    if (submitButton) {
      submitButton.disabled = true;
      form.setAttribute("aria-busy", "true");
    }

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formName: form.dataset.formName || "Website form submission",
          subject:
            form.dataset.emailSubject ||
            "D'Iberville Fishing Rodeo Form Submission",
          fields,
          pageUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Unable to send submission.");
      }

      form.reset();

      if (status) {
        status.textContent =
          "Thank you. Your submission was sent to the tournament team.";
      }
    } catch (error) {
      if (status) {
        status.textContent =
          "Something went wrong while sending. Please try again in a moment.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        form.removeAttribute("aria-busy");
      }
    }
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
