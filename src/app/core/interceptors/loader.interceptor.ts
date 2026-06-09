import { HttpContextToken, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { LoaderService } from "../services/loader.service";
import { finalize } from "rxjs";

export const SHOW_LOADER = new HttpContextToken<boolean>(() => false);

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(SHOW_LOADER)) {
    return next(req);
  }

  const loader = inject(LoaderService);
  loader.show();

  return next(req).pipe(
    finalize(() => loader.hide())
  );
};
