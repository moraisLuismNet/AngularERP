import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ErrorHandlerService {
  constructor() {}

  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "An unknown error has occurred.";

    if (error.error instanceof ErrorEvent) {
      // Customer-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage =
            "Unable to connect to the server. Verify that the microservice is running.";
          break;
        case 400:
          errorMessage = "Incorrect request. Please verify the information submitted.";
          break;
        case 401:
          errorMessage = "Unauthorized. Verify your credentials.";
          break;
        case 403:
          errorMessage =
            "Access is prohibited. You do not have permission for this action.";
          break;
        case 404:
          errorMessage = "Resource not found";
          break;
        case 500:
          errorMessage = "Internal Server Error";
          break;
        case 503:
          errorMessage = "Service unavailable. Please try again later.";
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    console.error("Error HTTP:", error);
    return throwError(() => new Error(errorMessage));
  }

  getErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          return "Unable to connect to the server";
        case 401:
          return "Incorrect credentials";
        case 403:
          return "Unauthorized access";
        case 404:
          return "Resource not found";
        case 500:
          return "Server error";
        default:
          return error.error?.message || "Connection error";
      }
    }
    return error.message || "Unknown error";
  }
}
