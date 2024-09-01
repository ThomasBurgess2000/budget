"use client";

import { dataProvider as dataProviderSupabase } from "@refinedev/supabase";
import { supabaseBrowserClient } from "@utils/supabase/client";

const supabaseDataProvider = dataProviderSupabase(supabaseBrowserClient);

export const dataProvider = {
  ...supabaseDataProvider,
  deleteOne: async ({ resource, id, meta }: { resource: string; id: string; meta: any }) => {
    if (resource === "MonthlyBudgets" && meta?.operation === "delete") {
      // Get categories associated with the monthly budget
      const { data: categories, error: categoriesFetchError } = await supabaseBrowserClient
        .from("Categories")
        .select("id")
        .eq("monthly_budget", id);

      if (categoriesFetchError) {
        throw categoriesFetchError;
      }

      // Delete transactions associated with the categories
      if (categories && categories.length > 0) {
        const categoryIds = categories.map(category => category.id);
        const { error: transactionsError } = await supabaseBrowserClient
          .from("Transactions")
          .delete()
          .in("category", categoryIds);

        if (transactionsError) {
          throw transactionsError;
        }
      }

      // Delete categories associated with the monthly budget
      const { error: categoriesError } = await supabaseBrowserClient
        .from("Categories")
        .delete()
        .eq("monthly_budget", id);

      if (categoriesError) {
        throw categoriesError;
      }
    }

    return supabaseDataProvider.deleteOne({ resource, id, meta });
  },
};
