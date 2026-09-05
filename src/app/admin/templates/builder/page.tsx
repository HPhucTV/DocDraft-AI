"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TemplateBuilder } from "@/components/admin/templates/template-builder";
import { CustomTemplateInput } from "@/lib/templates/template-service";
import { Loader2 } from "lucide-react";

function BuilderContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const [initialData, setInitialData] = useState<Partial<CustomTemplateInput> | null>(null);
  const [isLoading, setIsLoading] = useState(!!templateId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      return;
    }

    let isMounted = true;
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/admin/templates/${templateId}`);
        if (!res.ok) {
          throw new Error("Không tìm thấy mẫu văn bản yêu cầu");
        }
        const data = await res.json();
        const t = data.template;
        if (isMounted) {
          setInitialData({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            categoryId: t.categoryId || "quyet-dinh",
            industryPack: t.industryPack || "ADMIN",
            thumbnailUrl: t.thumbnailUrl || undefined,
            systemPrompt: t.systemPrompt,
            userPromptTemplate: t.userPromptTemplate,
            formSchema: t.formSchema,
            exportConfig: t.exportConfig,
            isPublished: t.isPublished,
          });
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Lỗi khi tải mẫu");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTemplate();
    return () => {
      isMounted = false;
    };
  }, [templateId]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  return (
    <TemplateBuilder
      initialData={initialData || undefined}
      isEditing={!!templateId}
    />
  );
}

export default function AdminTemplateBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
