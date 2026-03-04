"use client"

import * as React from "react"

import type { ToastActionElement } from "@/components/ui/toast"

type ToastVariant = "default" | "destructive"

export type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: ToastVariant
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type State = {
  toasts: Toast[]
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> & Pick<Toast, "id"> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    }
    case "UPDATE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }
    }
    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        queueRemove(toastId)
      } else {
        state.toasts.forEach((t) => queueRemove(t.id))
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId === undefined || t.id === toastId
            ? { ...t, open: false }
            : t
        ),
      }
    }
    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
    }
  }
}

function queueRemove(toastId: string) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type ToastInput = Omit<Toast, "id">

function toast(input: ToastInput) {
  const id = genId()

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  const update = (props: Partial<Toast>) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...input,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

