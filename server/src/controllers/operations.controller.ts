import { Request, Response } from 'express'
import { operationsService } from '../services/operations.service.js'

export const operationsController = {
  async getAll(req: Request, res: Response) {
    try {
      const { unitId } = req.params
      const { status, journalId } = req.query
      const operations = await operationsService.getAll(unitId, status as any, journalId as string | undefined)
      res.json(operations)
    } catch (error) {
      console.error('Error getting operations:', error)
      res.status(500).json({ error: 'Failed to get operations' })
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const operation = await operationsService.getById(id)
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' })
      }
      res.json(operation)
    } catch (error) {
      console.error('Error getting operation:', error)
      res.status(500).json({ error: 'Failed to get operation' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { unitId } = req.params
      const operation = await operationsService.create(unitId, {
        ...req.body,
        entryDate: req.body.entryDate ? new Date(req.body.entryDate) : undefined,
        bookingDate: req.body.bookingDate ? new Date(req.body.bookingDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      })
      res.status(201).json(operation)
    } catch (error) {
      console.error('Error creating operation:', error)
      res.status(500).json({ error: 'Failed to create operation' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const operation = await operationsService.update(id, {
        ...req.body,
        entryDate: req.body.entryDate ? new Date(req.body.entryDate) : undefined,
        bookingDate: req.body.bookingDate ? new Date(req.body.bookingDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      })
      res.json(operation)
    } catch (error) {
      console.error('Error updating operation:', error)
      res.status(500).json({ error: 'Failed to update operation' })
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      const operation = await operationsService.updateStatus(id, status)
      res.json(operation)
    } catch (error: any) {
      console.error('Error updating operation status:', error)
      // Return validation errors with 400 status
      if (error.message && (
        error.message.includes('zbilansowany') ||
        error.message.includes('zadekretowany') ||
        error.message.includes('dekret') ||
        error.message.includes('okres') ||
        error.message.includes('Okres') ||
        error.message.includes('Data księgowania')
      )) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Failed to update operation status' })
      }
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      await operationsService.delete(id)
      res.status(204).send()
    } catch (error) {
      console.error('Error deleting operation:', error)
      res.status(500).json({ error: 'Failed to delete operation' })
    }
  },

  // Journal Entries
  async addEntry(req: Request, res: Response) {
    try {
      const { operationId } = req.params
      const entry = await operationsService.addEntry(operationId, req.body)
      res.status(201).json(entry)
    } catch (error) {
      console.error('Error adding entry:', error)
      res.status(500).json({ error: 'Failed to add entry' })
    }
  },

  async updateEntry(req: Request, res: Response) {
    try {
      const { entryId } = req.params
      const entry = await operationsService.updateEntry(entryId, req.body)
      res.json(entry)
    } catch (error) {
      console.error('Error updating entry:', error)
      res.status(500).json({ error: 'Failed to update entry' })
    }
  },

  async deleteEntry(req: Request, res: Response) {
    try {
      const { entryId } = req.params
      await operationsService.deleteEntry(entryId)
      res.status(204).send()
    } catch (error) {
      console.error('Error deleting entry:', error)
      res.status(500).json({ error: 'Failed to delete entry' })
    }
  },
}

