export const canSendNotification = (lastSentAt, cooldownHours = 48) => {
  if (!lastSentAt) return { canSend: true };
  
  const now = new Date();
  const lastSent = new Date(lastSentAt);
  const diffMs = now - lastSent;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < cooldownHours) {
    const remainingHours = (cooldownHours - diffHours).toFixed(1);
    const nextAllowedAt = new Date(lastSent.getTime() + cooldownHours * 60 * 60 * 1000);
    return { 
      canSend: false, 
      remainingHours,
      nextAllowedAt
    };
  }
  
  return { canSend: true };
};
