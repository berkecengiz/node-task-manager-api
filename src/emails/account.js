const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'berkecengiz94@gmail.com',
        subject: 'Welcome to task-manager!',
        text: `Welcome to the app, ${name}. Let us know how do you like the app.`
    })
}

const sendByeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'berkecengiz94@gmail.com',
        subject: 'Are you leaving us? :(',
        text: `We are sad to hear you decided to leave us, ${name}. Let us know what we can do to make our application better for you!`
    })
}



module.exports = {
    sendWelcomeEmail,
    sendByeEmail
}
    