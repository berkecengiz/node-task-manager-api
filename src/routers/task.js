const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

// Post task
router.post('/task', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        createdBy: req.user._id
    }) 

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Get Tasks
// Filtering (/tasks?completed=false)
// Pagination (/tasks?limit=10&skip=0)
// Sorting (/tasks?sortBy=createdAt:desc:)
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'tasks', 
            match,
            "options": {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        res.status(201).send(req.user.tasks)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Get task by ID
router.get('/task/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, createdBy: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

// Update task by ID
router.patch('/task/:id', auth,  async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const task = await Task.findOne({_id: req.params.id, createdBy: req.user._id})

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Delete task by ID
router.delete('/task/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, createdBy: req.user._id})

        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router