export const binderMessages = {
  toast: {
    saved: "Your binder has been saved",
    editSaved: "Your edits have been saved",
    settingsSaved: "Settings updated",
    goalAdded: "Goal added",
    goalCompleted: "Goal completed",
    bulkBoxAdded: (addedCount: number) =>
      `Added ${addedCount} card(s) to Bulk Box.`,
    bulkBoxAddedAndFull: (addedCount: number, limit: number) =>
      `Added ${addedCount} card(s). Bulk Box is now full (${limit}/${limit}).`,
    bulkBoxEmptied: "Bulk Box emptied.",
  },
  errors: {
    saveFailed: "Failed to save changes.",
    addCardsBinderFull: (addedCount: number) =>
      `Only ${addedCount} card(s) were added because the binder is full.`,
    goalSaveFailed: "Failed to save goal changes.",
    goalLimitReached: "Goal limit reached. You can have up to 5 active goals.",
    goalDeleteLimitReached:
      "Delete limit reached. You can delete up to 10 goals every 24 hours.",
    bulkBoxFull: (limit: number) => `Bulk Box is full (${limit}/${limit}).`,
    bulkBoxSaveFailed: "Failed to update Bulk Box.",
  },
  auth: {
    signInRequired: "Please sign in to view this binder.",
  },
  leaveModal: {
    title: "You have unsaved changes",
    description: "Are you sure you want to leave without saving?",
    stay: "Stay",
    saveAndLeave: "Save and leave",
    discardAndLeave: "Discard and leave",
  },
} as const;
