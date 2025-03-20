export const JOB_CHAT = {
    NAME: 'chat-queue',
    NEW_MESSAGE: 'chat-new-message',
    DELETE_MESSAGE: 'chat-delete-message',
    NEW_MESSAGE_GROUP: 'chat-group-new-message',
};

export const JOB_FRIEND = {
    NAME: 'friend-queue',
    FRIEND_REQUEST: 'friend-request',
    CONFIRM_REQUEST: 'friend-confirm',
    REJECT_REQUEST: 'friend-reject',
}


export const JOB_Mail = {
    NAME: 'mail-queue',
    SEND_OTP_EMAIL: 'send-otp-email-verification',
    SEND_OTP_PASSWORD: 'send-otp-retrieve-password'
}

export const JOB_USER = {
    NAME: 'user-queue',
    UPDATE_LAST_SEEN: 'update-lastSeen',
    DELETE_LAST_SEEN: 'delete-lastSeen',
}