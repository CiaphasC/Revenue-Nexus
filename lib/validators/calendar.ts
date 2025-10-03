import { z } from "zod"

const activityTypes = ["deal", "meeting", "email", "call"] as const

const calendarEventBaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Añade un título descriptivo"),
  description: z.string().optional(),
  start: z
    .string()
    .min(1, "Indica la fecha de inicio")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Fecha de inicio inválida",
    }),
  end: z
    .string()
    .min(1, "Indica la fecha de fin")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Fecha de fin inválida",
    }),
  type: z.enum(activityTypes),
  owner: z.string().min(1, "Asigna un responsable"),
  organizer: z.string().optional(),
  location: z.string().optional(),
  calendarId: z.string().min(1, "Selecciona un calendario"),
  color: z.string().optional(),
  attendees: z.array(z.string().min(1)).default([]),
  allDay: z.boolean().optional(),
})

function validateChronology(data: { start: string; end: string }, ctx: z.RefinementCtx) {
  const startDate = new Date(data.start)
  const endDate = new Date(data.end)

  if (startDate >= endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["end"],
      message: "La hora de fin debe ser posterior a la de inicio",
    })
  }
}

export const calendarEventSchema = calendarEventBaseSchema.superRefine(validateChronology)

export const calendarEventFormSchema = calendarEventBaseSchema
  .omit({ attendees: true })
  .extend({ attendeesText: z.string().optional() })
  .superRefine(validateChronology)

export type CalendarEventInput = z.infer<typeof calendarEventSchema>
