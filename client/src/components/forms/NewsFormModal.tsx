import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewsInputSchema, type NewsInput } from "@valuechain/shared";
import { useQueryClient } from "@tanstack/react-query";
import { addManualNews } from "../../api/news";
import { Modal } from "./Modal";

interface NewsFormModalProps {
  stockId: number;
  onClose: () => void;
}

export function NewsFormModal({ stockId, onClose }: NewsFormModalProps) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsInput>({
    resolver: zodResolver(NewsInputSchema),
    defaultValues: { title: "", url: "", category: "OTHER" },
  });

  async function onSubmit(data: NewsInput) {
    await addManualNews(stockId, data);
    qc.invalidateQueries({ queryKey: ["stockNews", stockId] });
    onClose();
  }

  return (
    <Modal title="뉴스 직접 추가" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="entity-form">
        <label>
          제목
          <input {...register("title")} />
          {errors.title && <span className="form-error">{errors.title.message}</span>}
        </label>
        <label>
          링크
          <input {...register("url")} placeholder="https://..." />
          {errors.url && <span className="form-error">{errors.url.message}</span>}
        </label>
        <label>
          언론사
          <input {...register("source")} />
        </label>
        <label>
          발행일
          <input type="date" {...register("publishedAt")} />
        </label>
        <label>
          카테고리
          <select {...register("category")}>
            <option value="CONTRACT">계약</option>
            <option value="CANCELLATION">취소</option>
            <option value="ACHIEVEMENT">성공</option>
            <option value="EARNINGS">실적</option>
            <option value="OTHER">기타</option>
          </select>
        </label>
        <button type="submit" disabled={isSubmitting} className="primary-button">추가</button>
      </form>
    </Modal>
  );
}
