export const binderMessages = {
  toast: {
    saved: "Your binder has been saved",
    editSaved: "Your edits have been saved",
    settingsSaved: "Settings updated",
    goalAdded: "Goal added",
    goalCompleted: "Goal completed",
  },
  errors: {
    saveFailed: "Failed to save changes.",
    addCardsBinderFull: (addedCount: number) =>
      `Only ${addedCount} card(s) were added because the binder is full.`,
    goalSaveFailed: "Failed to save goal changes.",
    goalLimitReached: "Goal limit reached. Complete a goal to start the 24-hour cooldown.",
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
