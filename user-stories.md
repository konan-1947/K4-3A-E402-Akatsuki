# User stories — StudyPulse

## Phạm vi route

| Người dùng | Route | Mục tiêu chính |
| --- | --- | --- |
| Lab coach | `/labcoach` | Tạo, kiểm tra và xuất bản lesson từ tài liệu nguồn. |
| Học viên | `/user` | Học một concept khó bằng lesson trực quan, có nguồn dẫn và checkpoint. |

---

## 1. Lab coach — `/labcoach`

### US-LC-01 · Chọn nguồn để tạo lesson

**Là một** lab coach, **tôi muốn** chọn transcript, slide hoặc script liên quan đến một concept, **để** AI chỉ dùng các nguồn đã được duyệt khi tạo lesson.

**Tiêu chí chấp nhận**

- Có thể chọn một hoặc nhiều tài liệu nguồn.
- Mỗi nguồn hiển thị tên và phần/đoạn đã chọn.
- Không thể tạo lesson khi chưa chọn nguồn.

### US-LC-02 · Thiết lập mục tiêu lesson

**Là một** lab coach, **tôi muốn** nhập concept và mục tiêu học, **để** lesson được tạo phù hợp với trình độ học viên.

**Tiêu chí chấp nhận**

- Có trường concept, ví dụ: `Transformer Attention`.
- Có trường mục tiêu học hoặc mức độ mong muốn.
- Các thông tin này được hiển thị trong lesson tạo ra.

### US-LC-03 · Tạo bản nháp lesson bằng AI

**Là một** lab coach, **tôi muốn** AI tổng hợp nguồn thành bản nháp lesson, **để** giảm thời gian ghép các tài liệu rời rạc.

**Tiêu chí chấp nhận**

- Một lời gọi AI thật tạo ra: mental model, giải thích ngắn, ví dụ, diagram/mô tả diagram và checkpoint.
- Mỗi ý quan trọng có citation về nguồn tương ứng.
- Nếu nguồn không đủ, AI nêu phần thiếu thay vì tự khẳng định nội dung không có căn cứ.

### US-LC-04 · Rà soát và chỉnh sửa lesson

**Là một** lab coach, **tôi muốn** xem và chỉnh sửa bản nháp trước khi xuất bản, **để** tránh truyền đạt kiến thức sai hoặc chưa rõ.

**Tiêu chí chấp nhận**

- Có thể sửa tiêu đề, mental model, giải thích, ví dụ và câu checkpoint.
- Có thể xem citation của mỗi phần.
- Nội dung chưa xuất bản được đánh dấu là bản nháp.

### US-LC-05 · Xuất bản lesson

**Là một** lab coach, **tôi muốn** xuất bản lesson đã duyệt, **để** học viên có thể học trên route `/user`.

**Tiêu chí chấp nhận**

- Có nút xuất bản chỉ xuất hiện sau khi lesson có nội dung tối thiểu.
- Lesson xuất bản hiển thị trạng thái và thời điểm xuất bản.
- Lesson xuất bản có thể được mở bởi học viên.

---

## 2. Học viên — `/user`

### US-US-01 · Chọn lesson cần học lại

**Là một** học viên, **tôi muốn** xem danh sách lesson theo concept, **để** nhanh chóng tìm phần mình chưa hiểu.

**Tiêu chí chấp nhận**

- Danh sách hiển thị tiêu đề, concept và mô tả ngắn.
- Có thể mở một lesson để bắt đầu học.

### US-US-02 · Hiểu concept qua mental model trực quan

**Là một** học viên, **tôi muốn** xem mental model, diagram và ví dụ ngắn, **để** nối được các ý chính mà không phải mở nhiều tài liệu khác nhau.

**Tiêu chí chấp nhận**

- Lesson có mental model một câu, giải thích theo bước, diagram và ví dụ.
- Nội dung được chia nhỏ, dễ đọc trên một màn hình.
- Có thể mở citation để biết nội dung dựa trên slide hoặc transcript nào.

### US-US-03 · Hỏi lại khi chưa hiểu

**Là một** học viên, **tôi muốn** yêu cầu AI giải thích lại một phần của lesson, **để** hiểu rõ theo cách diễn đạt khác mà vẫn bám vào nguồn học.

**Tiêu chí chấp nhận**

- Có thể chọn một phần lesson và yêu cầu giải thích lại.
- Phản hồi AI liên kết với lesson hoặc nguồn đã chọn.
- Nếu câu hỏi vượt ngoài nguồn, AI nói rõ giới hạn và gợi ý tài liệu cần xem thêm.

### US-US-04 · Tự kiểm tra mức hiểu

**Là một** học viên, **tôi muốn** làm checkpoint sau khi học, **để** biết mình đã hiểu concept hay chưa.

**Tiêu chí chấp nhận**

- Lesson có ít nhất một checkpoint.
- Sau khi trả lời, học viên nhận phản hồi đúng/sai kèm giải thích.
- Nếu trả lời sai, giao diện chỉ lại phần lesson nên xem lại.

### US-US-05 · Hoàn thành lesson

**Là một** học viên, **tôi muốn** thấy lesson đã hoàn thành sau checkpoint, **để** biết mình đã học xong phần đó.

**Tiêu chí chấp nhận**

- Sau khi hoàn thành checkpoint, lesson có trạng thái hoàn thành.
- Hiển thị gợi ý học tiếp hoặc xem lại nguồn nếu cần.

---

## MVP demo đề xuất

Trong lượt demo đầu tiên, ưu tiên triển khai đầy đủ luồng sau:

1. Lab coach chọn nguồn và concept.
2. AI tạo lesson có citation.
3. Lab coach duyệt và xuất bản.
4. Học viên mở lesson, xem diagram và làm một checkpoint.

Các user story hỏi lại bằng AI, danh sách nhiều lesson và theo dõi tiến độ có thể để sau nếu thiếu thời gian.
