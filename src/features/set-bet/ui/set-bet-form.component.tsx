import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import {
  setBetMutationKey,
  useSetBetMutation,
} from "@/features/set-bet/api/set-bet.mutation";
import {
  createSetBetSchema,
  type SetBetFormInput,
  type SetBetFormValues,
} from "@/features/set-bet/model/set-bet.schema";
import type { SetBetViewModel } from "@/features/set-bet/model/set-bet.vm";
import { ApiError } from "@/shared/api/api-error";
import { formatMoney } from "@/shared/lib/format-money";
import { showAppToast } from "@/shared/ui/toast/app-toast-manager";

type SetBetFormProps = {
  auction: SetBetViewModel;
};

function fieldError(error: ApiError): string | undefined {
  const problem = error.problem;

  if (!problem || !("errors" in problem)) {
    return undefined;
  }

  return problem.errors.find((item) => item.field === "price")?.message;
}

export function SetBetForm({ auction }: SetBetFormProps) {
  const schema = createSetBetSchema(auction.constraints);
  const queryClient = useQueryClient();
  const mutation = useSetBetMutation(auction.auctionUuid);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<SetBetFormInput, unknown, SetBetFormValues>({
    defaultValues: {
      price:
        auction.constraints.available == null
          ? ""
          : String(auction.constraints.available),
    },
    resolver: zodResolver(schema),
  });
  const isPending = isSubmitting || mutation.isPending;
  const errorMessage = errors.price?.message;
  const descriptionId = errorMessage
    ? "set-bet-price-hint set-bet-price-error"
    : "set-bet-price-hint";

  const submit = handleSubmit(async ({ price }) => {
    if (
      queryClient.isMutating({
        mutationKey: setBetMutationKey(auction.auctionUuid),
      }) > 0
    ) {
      return;
    }

    try {
      await mutation.mutateAsync({ price });
      showAppToast({
        description: `${formatMoney(
          price,
          auction.currencyCode,
        )} синхронизирована с аукционом`,
        id: `bet-success-${auction.auctionUuid}`,
        title: "Ставка принята",
        tone: "success",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const message = fieldError(error);

        if (message) {
          setError("price", { message, type: "server" });
          showAppToast({
            description:
              "Ставка не отправлена. Проверьте сообщение у поля и повторите.",
            id: `bet-error-${auction.auctionUuid}`,
            title: "Ошибка ставки",
            tone: "error",
          });
          return;
        }

        const rootMessage =
          error.status === 403
            ? "Ставка больше недоступна. Обновите условия аукциона."
            : error.message;
        setError("root.server", {
          message: rootMessage,
          type: "server",
        });
        showAppToast({
          description:
            "Ставка не отправлена. Проверьте сообщение в форме и повторите.",
          id: `bet-error-${auction.auctionUuid}`,
          title: "Ошибка ставки",
          tone: "error",
        });
        return;
      }

      const rootMessage = "Не удалось отправить ставку. Попробуйте ещё раз.";
      setError("root.server", {
        message: rootMessage,
        type: "server",
      });
      showAppToast({
        description:
          "Ставка не отправлена. Проверьте сообщение в форме и повторите.",
        id: `bet-error-${auction.auctionUuid}`,
        title: "Ошибка ставки",
        tone: "error",
      });
    }
  });

  return (
    <div className="set-bet-form-shell">
      <div className="set-bet-form-shell__signal">
        <span aria-hidden="true" />
        Канал ставки открыт
      </div>
      <form className="set-bet-form" onSubmit={submit} noValidate>
        <label htmlFor="set-bet-price">Сумма ставки</label>
        <div className="set-bet-form__input">
          <input
            {...register("price")}
            id="set-bet-price"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-describedby={descriptionId}
            aria-invalid={Boolean(errorMessage)}
          />
          <span>{auction.currencySuffix}</span>
        </div>
        <p id="set-bet-price-hint" className="set-bet-form__hint">
          {auction.constraints.available == null
            ? "Введите цену в пределах условий торгов"
            : `Следующая доступная цена ${formatMoney(
                auction.constraints.available,
                auction.currencyCode,
              )}`}
          {auction.constraints.step == null
            ? ""
            : ` · шаг ${formatMoney(
                auction.constraints.step,
                auction.currencyCode,
              )}`}
        </p>
        {errorMessage ? (
          <p
            id="set-bet-price-error"
            className="set-bet-form__error"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        {errors.root?.server?.message ? (
          <p className="set-bet-form__error" role="alert">
            {errors.root.server.message}
          </p>
        ) : null}
        <button type="submit" disabled={isPending}>
          {isPending ? "Отправляем ставку…" : "Сделать ставку"}
        </button>
      </form>
    </div>
  );
}
