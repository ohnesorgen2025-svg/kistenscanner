import { Router } from "express";

import {
  createLoan,
  getActiveLoansForItem,
  listActiveLoans,
  returnLoan,
} from "../services/inventory.js";

function parseRouteId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Ungültige ID.");
  }

  return id;
}

export const loansRouter = Router();

loansRouter.get("/", (_request, response) => {
  response.json(listActiveLoans());
});

loansRouter.get("/item/:itemId", (request, response) => {
  try {
    const itemId = parseRouteId(request.params.itemId);
    response.json(getActiveLoansForItem(itemId));
  } catch (error) {
    response.status(400).json({
      error: error instanceof Error ? error.message : "Ausleihen konnten nicht geladen werden.",
    });
  }
});

loansRouter.post("/", (request, response) => {
  try {
    const itemId = Number(request.body.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return response.status(400).json({ error: "itemId ist erforderlich." });
    }

    const borrowerName = typeof request.body.borrowerName === "string" ? request.body.borrowerName : "";
    const dueDate = typeof request.body.dueDate === "string" ? request.body.dueDate : undefined;
    const notes = typeof request.body.notes === "string" ? request.body.notes : undefined;

    const loan = createLoan({ itemId, borrowerName, dueDate, notes });
    return response.status(201).json(loan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ausleihe konnte nicht erstellt werden.";
    return response.status(400).json({ error: message });
  }
});

loansRouter.patch("/:id/return", (request, response) => {
  try {
    const loanId = parseRouteId(request.params.id);
    const loan = returnLoan(loanId);
    response.json(loan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rückgabe fehlgeschlagen.";
    response.status(message === "Ausleihe nicht gefunden." ? 404 : 400).json({ error: message });
  }
});
