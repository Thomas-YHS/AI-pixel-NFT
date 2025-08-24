import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UseBalanceParameters, useBalance } from "wagmi";

/**
 * Wrapper around wagmi's useBalance hook. Updates data on every block change.
 */
export const useWatchBalance = (useBalanceParameters: UseBalanceParameters) => {
  const queryClient = useQueryClient();
  const { data: blockNumber } = { data: 0 };
  const { queryKey, ...restUseBalanceReturn } = useBalance(useBalanceParameters);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  return restUseBalanceReturn;
};
