"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Deal } from "@/lib/types"

interface NewDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDealCreated: (deal: Deal) => void
}

type DealActionState = { success: true; deal: Deal } | { success: false; error: string }

async function createDealAction(formData: FormData): Promise<DealActionState> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const titleEntry = formData.get("title")
  const companyEntry = formData.get("company")
  const valueEntry = formData.get("value")
  const stageEntry = formData.get("stage")
  const contactEntry = formData.get("contact")
  const closeDateEntry = formData.get("closeDate")

  const title = typeof titleEntry === "string" ? titleEntry.trim() : ""
  const company = typeof companyEntry === "string" ? companyEntry.trim() : ""
  const contact = typeof contactEntry === "string" ? contactEntry.trim() : ""
  const closeDate = typeof closeDateEntry === "string" ? closeDateEntry : ""
  const value = typeof valueEntry === "string" ? Number.parseFloat(valueEntry) : Number.NaN
  const stage = typeof stageEntry === "string" && stageEntry ? (stageEntry as Deal["stage"]) : null

  if (!title || !company || !Number.isFinite(value) || !stage || !contact || !closeDate) {
    return { success: false, error: "Todos los campos son requeridos" }
  }

  const newDeal: Deal = {
    id: Date.now().toString(),
    title,
    company,
    value,
    stage,
    probability:
      stage === "lead"
        ? 20
        : stage === "qualified"
          ? 40
          : stage === "proposal"
            ? 60
            : stage === "negotiation"
              ? 75
              : 100,
    closeDate,
    contact,
  }

  return { success: true, deal: newDeal }
}

export function NewDealDialog({ open, onOpenChange, onDealCreated }: NewDealDialogProps) {
  const [state, setState] = useState<DealActionState | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (state?.success && state.deal) {
      onDealCreated(state.deal)
      onOpenChange(false)
    }
  }, [state, onDealCreated, onOpenChange])

  useEffect(() => {
    if (!open) {
      setState(null)
    }
  }, [open])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setIsPending(true)
    setState(null)

    try {
      const result = await createDealAction(formData)
      setState(result)
    } catch (error) {
      setState({ success: false, error: "No se pudo crear el negocio. Inténtalo nuevamente." })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Crear Nuevo Negocio</DialogTitle>
          <DialogDescription>Agrega un nuevo negocio a tu pipeline</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Negocio</Label>
            <Input id="title" name="title" placeholder="Plan Empresarial - Acme Corp" required disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" name="company" placeholder="Acme Corp" required disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor del Negocio (S/)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              placeholder="50000"
              required
              disabled={isPending}
              min="0"
              step="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Select name="stage" required disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Prospecto</SelectItem>
                <SelectItem value="qualified">Calificado</SelectItem>
                <SelectItem value="proposal">Propuesta</SelectItem>
                <SelectItem value="negotiation">Negociación</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Persona de Contacto</Label>
            <Input id="contact" name="contact" placeholder="Juan Pérez" required disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeDate">Fecha de Cierre Esperada</Label>
            <Input id="closeDate" name="closeDate" type="date" required disabled={isPending} />
          </div>

          {state && !state.success && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Negocio"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
