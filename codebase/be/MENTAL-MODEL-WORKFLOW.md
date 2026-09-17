# Mental Model Workflow

Workflow thử nghiệm để biến nhiều tài liệu đầu vào thành một mental model có cấu trúc, có thể truy ngược về nguồn và kiểm tra lại.

## 1. Mục tiêu và phạm vi V1

### Mục tiêu

- Đọc nhiều tài liệu mà không cần đưa toàn bộ nội dung vào một prompt.
- Trích xuất facts có cấu trúc trước khi tổng hợp.
- Xây mental model từ nhỏ đến lớn: chunk → domain → toàn hệ thống.
- Giữ source citation cho mọi fact và kết luận quan trọng.
- Phát hiện mâu thuẫn, giả định và thông tin còn thiếu.

### Ngoài phạm vi V1

- Không xây chatbot hỏi đáp.
- Không cần vector database hoặc RAG runtime.
- Không tự động quyết định tài liệu nào đúng khi các nguồn mâu thuẫn.
- Đã có REST endpoint multipart làm transport từ frontend xuống backend; chưa có database hoặc authentication.

Parser nên được thiết kế tách biệt để sau này bổ sung PDF, DOCX và OCR. Prototype đầu tiên có thể chạy với Markdown/text.

## 2. Kiến trúc tổng thể

```text
Documents
  → Parse & normalize text
  → Create chunks with source locations
  → Extract facts as JSON
  → Normalize and deduplicate facts
  → Group facts by domain/topic
  → Synthesize domain models
  → Integrate cross-domain relationships
  → Synthesize global mental model
  → Validate coverage, conflicts and citations
```

Mọi lời gọi model phải đi qua `AiClient`. Khi cần JSON, dùng bean `jsonAiClient` trong `AiClientConfig`; bean này hiện đã cấu hình fallback DeepSeek → OpenAI.

## 3. Input và artifact trung gian

### 3.1. Document manifest

Mỗi file cần được đăng ký trước khi xử lý:

```json
{
  "document_id": "doc_001",
  "path": "docs/payment_spec.md",
  "file_name": "payment_spec.md",
  "media_type": "text/markdown",
  "version": "2026-09-01",
  "checksum": "sha256:...",
  "topic": "payment",
  "authority": "high"
}
```

`checksum` dùng để bỏ qua file chưa thay đổi trong các lần chạy sau. `authority` chỉ là metadata hỗ trợ review, không được dùng để âm thầm loại bỏ nguồn khác.

### 3.2. Document chunk

Chunk phải giữ ngữ cảnh và vị trí nguồn:

```json
{
  "chunk_id": "doc_001_sec_03",
  "document_id": "doc_001",
  "heading": "Refund policy",
  "text": "...",
  "source_location": {
    "page": 12,
    "section": "3.2",
    "line_start": null,
    "line_end": null
  }
}
```

Ưu tiên cắt theo heading, bảng, API endpoint, requirement hoặc workflow. Chỉ cắt theo token khi section quá lớn. Nếu phải cắt, giữ overlap nhỏ để không mất ngữ cảnh điều kiện và kết luận.

### 3.3. Fact set

AI không trả về một đoạn summary tự do mà trả về schema sau:

```json
{
  "chunk_id": "doc_001_sec_03",
  "entities": [
    {
      "name": "Order",
      "type": "entity",
      "description": "Đơn hàng của người dùng",
      "source": "doc_001_sec_03"
    }
  ],
  "relationships": [
    {
      "from": "User",
      "relation": "creates",
      "to": "Order",
      "status": "explicit",
      "source": "doc_001_sec_03"
    }
  ],
  "states": [
    {
      "entity": "Order",
      "state": "PENDING",
      "source": "doc_001_sec_03"
    }
  ],
  "workflows": [
    {
      "name": "Cancel order",
      "steps": [
        "Check order state",
        "Cancel directly or create refund request"
      ],
      "source": "doc_001_sec_03"
    }
  ],
  "rules": [
    {
      "statement": "Order ở PENDING có thể bị hủy",
      "conditions": ["Order.state == PENDING"],
      "consequences": ["Allow cancellation"],
      "status": "explicit",
      "confidence": 0.95,
      "source": "doc_001_sec_03"
    }
  ],
  "ownership": [],
  "assumptions": [],
  "open_questions": [],
  "conflicts": []
}
```

Quy ước:

- `explicit`: tài liệu nói trực tiếp.
- `inferred`: suy luận từ một hoặc nhiều facts; bắt buộc ghi rõ.
- `conflict`: không thể thống nhất với một source khác.
- `confidence` chỉ là tín hiệu review, không thay thế bằng chứng.
- Mỗi item phải có `source`; nếu không xác định được source thì không đưa vào kết luận cuối.

## 4. Các bước xử lý

### Bước 1 — Inventory và parse

1. Quét thư mục input.
2. Tạo manifest cho từng file.
3. Tính checksum.
4. Parse nội dung thành text có heading/page/line metadata.
5. Đánh dấu file không parse được để review, không silently bỏ qua.

Output: `manifest.json` và danh sách `DocumentChunk`.

### Bước 2 — Extract facts theo chunk

Mỗi chunk được gửi độc lập tới `jsonAiClient`.

Prompt chuẩn:

```text
Bạn là một evidence extraction engine.

Nhiệm vụ:
1. Chỉ lấy thông tin được nói rõ trong nội dung nguồn.
2. Không tự bổ sung thông tin còn thiếu.
3. Trích xuất entities, relationships, states, workflows,
   business rules, ownership, assumptions và open questions.
4. Mỗi item phải có source trỏ về chunk hiện tại.
5. Nếu có điều kiện hoặc ngoại lệ, giữ nguyên điều kiện đó.
6. Không hòa giải các mâu thuẫn; ghi chúng vào conflicts.
7. Phân biệt explicit và inferred.
8. Trả về JSON đúng schema, không thêm markdown hay giải thích.

Metadata nguồn:
- document_id: {document_id}
- file: {file_name}
- heading: {heading}
- source_location: {source_location}

Nội dung:
{chunk_text}
```

Nếu model trả JSON lỗi, retry một lần với prompt sửa JSON. Nếu vẫn lỗi, ghi chunk vào `failed_extractions.jsonl` và dừng hoặc tiếp tục theo chế độ batch đã chọn; prototype nên tiếp tục xử lý các chunk còn lại nhưng phải báo cáo số lỗi.

Output: `facts.jsonl`.

### Bước 3 — Normalize và deduplicate

Không dùng AI để tự do viết lại toàn bộ facts. Thực hiện theo thứ tự:

1. Chuẩn hóa tên theo glossary.
2. Gộp facts có cùng entity/relationship và giữ toàn bộ sources.
3. Đánh dấu các facts gần giống nhưng có điều kiện khác nhau.
4. Tìm các rule cùng nói về một entity hoặc workflow để đưa vào conflict review.

Ví dụ:

```text
customer, client, user → User
purchase, order → Order
```

Embedding/search chỉ là tối ưu tùy chọn cho việc tìm facts tương tự; kết quả cuối vẫn phải qua bước giữ source và review conflict.

Output: `entities.json`, `relationships.json`, `normalized-facts.jsonl`, `conflicts.json`.

### Bước 4 — Synthesize domain model

Gom facts theo `topic`, entity trung tâm hoặc nhóm workflow. Mỗi domain được tổng hợp độc lập.

Prompt chuẩn:

```text
Dựa trên các facts có evidence bên dưới, hãy xây dựng domain model.

Phải trả về:
- purpose
- entities
- relationships
- states_and_transitions
- workflows
- business_rules
- ownership
- dependencies
- conflicts
- assumptions
- open_questions

Yêu cầu:
- Không tạo claim không có trong facts.
- Mỗi kết luận phải chứa danh sách source.
- Gắn status explicit hoặc inferred.
- Không tự chọn một source khi có conflict.
- Nếu evidence không đủ, đưa vào open_questions.

Facts:
{domain_facts}
```

Output: một `DomainModel` cho mỗi domain, ví dụ `domain_models/payment.json`.

### Bước 5 — Integrate cross-domain model

Đưa các domain model, entity glossary và conflict list vào một lượt tổng hợp riêng. Tập trung vào:

- entity xuất hiện ở nhiều domain;
- ownership của entity;
- workflow đi qua nhiều domain;
- dependency giữa module/hệ thống;
- dữ liệu vào/ra giữa các domain;
- tác động khi một state hoặc rule thay đổi.

Không đưa toàn bộ raw document vào bước này trừ khi cần truy vấn lại source cho một conflict cụ thể.

Output: `cross-domain-map.json`.

### Bước 6 — Synthesize pure mental model

Prompt chuẩn:

```text
Hãy xây dựng một mental model thuần túy từ các domain models
và conflict list được cung cấp. Đây là bản đồ kiến thức có căn cứ nguồn,
không phải lesson plan hay nội dung bài giảng.

Output gồm:
1. title
2. scope
3. purpose
4. oneSentence
5. explanation
6. core_idea
7. causal_mechanism (when, then, because)
8. components, actors, core_entities và entity_relationships
9. main_workflows, state_transitions và business_rules
10. ownership_and_dependencies và external_systems
11. boundaries
12. contradictions, assumptions, open_questions, citations và evidence_map

Quy tắc:
- Mô tả cấu trúc của hệ thống và quan hệ nhân-quả giữa các thành phần.
- Scope nêu phạm vi được mô hình hóa và những gì nằm ngoài phạm vi.
- Boundaries nêu điều kiện, giới hạn hoặc trường hợp không áp dụng.
- Mọi claim quan trọng phải có source.
- Phân biệt fact đã xác nhận và inference.
- Không loại bỏ conflict; trình bày cả các phiên bản mâu thuẫn.
- Không điền khoảng trống bằng kiến thức bên ngoài.
- Không tạo learning goal, prerequisites, analogy, worked example,
  misconception, feedback, checkpoint hoặc transfer task; các nội dung đó
  thuộc bước lesson blueprint.

Domain models:
{domain_models}

Conflicts:
{conflicts}
```

Output: `mental-model.json` và bản đọc được `mental-model.md`. Đây là đầu vào
cho bước tạo lesson blueprint; blueprint chịu trách nhiệm chuyển bản đồ kiến thức
thành trình tự dạy, ví dụ, mô phỏng và checkpoint.

### Bước 7 — Validate

Chạy validator bằng code trước. AI audit là phần mở rộng chưa bắt buộc trong prototype:

- item nào thiếu source;
- entity trong facts nhưng không xuất hiện trong model;
- relationship trỏ tới entity không tồn tại;
- workflow thiếu step hoặc state transition;
- claim không phân biệt explicit/inferred;
- conflict đã phát hiện nhưng bị bỏ qua;
- source citation không tồn tại trong manifest/chunks.

Prompt audit:

```text
Hãy audit mental model dựa trên facts và domain models.

Tìm:
- claim không có source;
- entity hoặc relationship bị bỏ sót;
- workflow thiếu bước;
- inference bị trình bày như fact;
- conflict chưa được ghi nhận;
- kết luận vượt quá evidence.

Trả về JSON gồm errors, warnings và covered_sources.
```

Output: `validation-report.json`.

## 5. Interface backend

Các module hiện tại giữ các boundary sau:

```java
DocumentManifestService inventory(Path input);
List<DocumentChunk> parse(DocumentManifest document);
FactSet extract(DocumentChunk chunk);
NormalizedFacts normalize(List<FactSet> facts);
DomainModel synthesizeDomain(String domain, NormalizedFacts facts);
CrossDomainMap integrate(List<DomainModel> domains);
MentalModel synthesize(List<DomainModel> domains, CrossDomainMap map);
ValidationReport validate(MentalModel model, NormalizedFacts facts);
```

API transport:

```text
POST /api/mental-model/runs
  multipart files=<multiple files>&topicInstruction=<optional>
  → 202 { runId, status }

GET /api/mental-model/runs/{runId}
  → { runId, status, completed, total, stage, error, updatedAt }

GET /api/mental-model/runs/{runId}/result
  → { runId, mentalModel, renderedHtml, validation }
```

Mọi module AI dùng `AiClient`. Module trả JSON dùng `@Qualifier("jsonAiClient") AiClient`; không gọi trực tiếp adapter DeepSeek/OpenAI.

## 6. Artifact và logging

Một lần chạy nên tạo các artifact sau:

```text
run/<run_id>/manifest.json
run/<run_id>/chunks.jsonl
run/<run_id>/facts.jsonl
run/<run_id>/failed-extractions.jsonl
run/<run_id>/normalized-facts.jsonl
run/<run_id>/domain-models/*.json
run/<run_id>/cross-domain-map.json
run/<run_id>/mental-model.json
run/<run_id>/mental-model.md
run/<run_id>/validation-report.json
```

Log tối thiểu: `run_id`, `document_id`, `chunk_id`, model/provider, số token nếu lấy được, thời gian, trạng thái thành công/thất bại và lỗi đã làm sạch secret.

## 7. Tiêu chí thử nghiệm V1

- Chạy được với một bộ Markdown/text nhỏ.
- Chunk có entity, rule và workflow được trích xuất đúng schema.
- Mọi fact trong output truy ngược được về file và section.
- Entity đồng nghĩa được chuẩn hóa.
- Rule mâu thuẫn được đưa vào `conflicts` thay vì bị mất.
- Domain model chỉ dùng facts đầu vào.
- Global mental model có entities, relationships, workflows, rules và open questions.
- Validator phát hiện được claim không có source.
- Một chunk lỗi JSON không làm mất báo cáo các chunk còn lại.
- Không gửi API thật trong unit test; dùng mock `AiClient`.

## 8. Thứ tự triển khai prototype

1. Định nghĩa Java records/DTO cho các schema trên.
2. Implement parser Markdown/text và source locator.
3. Implement `FactExtractor` dùng `jsonAiClient`.
4. Lưu artifact dạng JSONL theo `run_id`.
5. Implement normalization đơn giản bằng glossary cấu hình.
6. Implement domain synthesis và global synthesis.
7. Implement validator schema/source.
8. Viết test với golden set nhỏ trong `eval/`.
9. Chỉ sau khi V1 ổn định mới thêm OCR hoặc semantic search.

Các bước 2–7 đã được hiện thực trong package `com.akatsuki.studypulse.mental`; frontend gọi API bằng upload multipart
và polling job status.
