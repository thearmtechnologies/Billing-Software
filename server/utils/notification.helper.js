export const canSendNotification = (lastSentAt, cooldownHours = 48) => {
  if (!lastSentAt) return { canSend: true };
  
  const now = new Date();
  const diffMs = now - new Date(lastSentAt);
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < cooldownHours) {
    const remainingHours = (cooldownHours - diffHours).toFixed(1);
    return { 
      canSend: false, 
      remainingHours 
    };
  }
  
  return { canSend: true };
};
