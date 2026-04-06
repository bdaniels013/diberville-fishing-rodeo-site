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
