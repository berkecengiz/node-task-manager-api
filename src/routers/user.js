const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

const auth = require('../middleware/auth')
const User = require('../models/user')
const { sendWelcomeEmail, sendByeEmail } = require('../emails/account')

const router = new express.Router()

// Post User - Sign Up
router.post('/user', async (req, res) => {
    const user = new User(req.body)
    let token

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

// Log User
router.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user , token })
    } catch (err) {
        res.status(400).send()
    }
})

// Log-out
router.post('/user/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Log-out all 
router.post('/user/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Get Users
router.get('/user/me', auth, async (req, res) => {
    res.send(req.user)
})

// Get User by ID
router.get('/user/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.status(400).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }

})

// Update User -- Patch only updates given fields since put changes all data in the entity
router.patch('/user/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Delete User
router.delete('/user/me', auth , async (req, res) => {
    try {
        sendByeEmail(req.user.email, req.user.name)
        req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

const storage = multer.memoryStorage()

const upload = multer({
    dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must type must be an image(jpg, jpeg, png)'))
        }
        
        cb(undefined, true)

    }, storage
})

// Upload profile picture 
router.post('/user/me/avatar', auth, upload.single('avatar') , async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250}).toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => { 
    res.status(400).send({ error: error.message })
})

// Delete profile picture
router.delete('/user/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

// Get profil picture by user id (/user/:id/avatar)
router.get('/user/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type' , 'image/png')
        res.send(user.avatar)

    } catch(err) {
        res.status(404).send()
    }
})

module.exports = router