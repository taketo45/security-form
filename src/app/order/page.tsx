"use client";

// ========================================
// 注文フォーム（クロスフィールドバリデーション）
// ========================================

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

// ========================================
// スキーマ定義
// ========================================

//  注文フォームの要件
/*


│  【基本情報】                                                   │
│  ・名前: 必須、50文字以内                                      │
│  ・メール: 必須、メール形式                                    │
│  ・電話番号: 必須、10〜11桁の数字                              │
│                                                                 │
│  【配送情報】                                                   │
│  ・郵便番号: 必須、7桁の数字                                   │
│  ・住所: 必須、200文字以内                                     │
│                                                                 │
│  【注文情報】                                                   │
│  ・商品カテゴリ: 必須、enum (food, drink, other)               │
│  ・数量: 必須、1〜99の整数                                     │
│  ・配送日指定: 任意、未来の日付                                │
│                                                                 │
│  【支払い情報】                                                 │
│  ・支払い方法: 必須、enum (credit, bank, cod)                  │
│  ・クレジットカード番号: 支払い方法が credit の場合のみ必須    │
│    （16桁の数字）                                              │
│                                                                 │
│  【その他】                                                     │
│  ・備考: 任意、500文字以内                                     │
│  ・利用規約同意: 必須、true のみ許可                      
*/



const orderSchema = z
  .object({
    // 名前
    name: z.string().min(1, "名前は必須です").max(50, "50文字以内で入力してください"),

    // メールアドレス
    email: z.string().min(1, "メールアドレスは必須です").email("正しいメール形式で入力してください"),

    // 電話番号
    phone: z.string().regex(/^[0-9]{10,11}$/, "10〜11桁の数字で入力してください"),

    // 郵便番号
    postalCode: z.string().regex(/^[0-9]{7}$/, "7桁の数字で入力してください"),

    // 住所
    address: z.string().min(1, "住所は必須です").max(200, "200文字以内で入力してください"),

    // 商品カテゴリ
    category: z.enum(["food", "drink", "other"], {
      message: "正しい商品カテゴリを選択してください",
    }),

    // 数量
    quantity: z.number().int("数量は整数で入力してください").min(1, "数量は1以上で入力してください").max(99, "数量は99以下で入力してください"),

    // 配送日指定
    deliveryDate: z
      .string()
      .optional()
      .refine((date) => {
        if (!date) return true; // 任意項目なので空は許可
        const today = new Date();
        const selectedDate = new Date(date);
        return selectedDate > today; // 未来の日付のみ許可
      }, "配送日指定は未来の日付を選択してください"),

    // 支払い方法
    paymentMethod: z.enum(["credit", "bank", "cod"], {
      message: "正しい支払い方法を選択してください",
    }),

    // クレジットカード番号（paymentMethod が credit の場合に必須）
    // ※ クロスフィールド検証は .superRefine() で行います
    cardNumber: z.string().optional(),

    // 備考
    notes: z.string().max(500, "500文字以内で入力してください").optional(),

    // 利用規約同意
    agreeTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "利用規約に同意してください",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "credit") {
      if (!/^[0-9]{16}$/.test(data.cardNumber || "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "クレジットカード番号は16桁の数字で入力してください",
          path: ["creditCardNumber"],
        });
      }
    }
  });



type OrderFormData = z.infer<typeof orderSchema>;

export default function RegisterForm() {
  const [submittedData, setSubmittedData] = useState<OrderFormData | null>(
    null
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      postalCode: "",
      address: "",
      category: "" as "food" | "drink" | "other",
      quantity: 1,
      deliveryDate: "",
      paymentMethod: "" as "credit" | "bank" | "cod",
      cardNumber: "",
      notes: "",
      agreeTerms: false,
    },
  });

  // contactType を監視（条件付き表示に使う）
  const paymentMethod = watch("paymentMethod");

  const onSubmit = (data: OrderFormData) => {
    console.log("=== 登録データ ===");
    console.log(data);
    setSubmittedData(data as OrderFormData);
  };


  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">ご注文フォーム</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          {/* 基本情報 */}
          <h2 className="text-lg font-bold mb-4 pb-2 border-b">基本情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("email")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("phone")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.phone ? "border-red-500" : ""
                }`}
                placeholder="09012345678"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* 配送情報 */}
          <h2 className="text-lg font-bold mb-4 pb-2 border-b">配送情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                郵便番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("postalCode")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.postalCode ? "border-red-500" : ""
                }`}
                placeholder="1234567"
              />
              {errors.postalCode && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.postalCode.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                住所 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("address")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.address ? "border-red-500" : ""
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
              )}
            </div>
          </div>

          {/* 注文情報 */}
          <h2 className="text-lg font-bold mb-4 pb-2 border-b">注文情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                商品カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                {...register("category")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.category ? "border-red-500" : ""
                }`}
              >
                <option value="">選択してください</option>
                <option value="food">食品</option>
                <option value="drink">飲料</option>
                <option value="other">その他</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("quantity")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.quantity ? "border-red-500" : ""
                }`}
                min="1"
                max="99"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                配送日指定
              </label>
              <input
                type="date"
                {...register("deliveryDate")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.deliveryDate ? "border-red-500" : ""
                }`}
              />
              {errors.deliveryDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.deliveryDate.message}
                </p>
              )}
            </div>
          </div>

          {/* 支払い情報 */}
          <h2 className="text-lg font-bold mb-4 pb-2 border-b">支払い情報</h2>

          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                支払い方法 <span className="text-red-500">*</span>
              </label>
              <select
                {...register("paymentMethod")}
                className={`shadow border rounded w-full py-2 px-3 ${
                  errors.paymentMethod ? "border-red-500" : ""
                }`}
              >
                <option value="">選択してください</option>
                <option value="credit">クレジットカード</option>
                <option value="bank">銀行振込</option>
                <option value="cod">代金引換</option>
              </select>
              {errors.paymentMethod && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {paymentMethod === "credit" && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  カード番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("cardNumber")}
                  className={`shadow border rounded w-full py-2 px-3 ${
                    errors.cardNumber ? "border-red-500" : ""
                  }`}
                  placeholder="1234567890123456"
                  maxLength={16}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cardNumber.message}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">16桁の数字</p>
              </div>
            )}
          </div>

          {/* その他 */}
          <h2 className="text-lg font-bold mb-4 pb-2 border-b">その他</h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              備考
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className={`shadow border rounded w-full py-2 px-3 ${
                errors.notes ? "border-red-500" : ""
              }`}
              placeholder="配送に関するご要望など"
            />
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* 利用規約 */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register("agreeTerms")}
                className="mr-2"
              />
              <span className="text-sm">
                利用規約に同意する <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs mt-1">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            注文を確定する
          </button>
        </form>

        {submittedData && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-bold text-lg mb-2">✅ 注文データ:</h2>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 text-center">
          <a href="/register" className="text-blue-500 hover:underline text-sm">
            ← 会員登録に戻る
          </a>
        </div>
      </div>
    </div>
  );
}