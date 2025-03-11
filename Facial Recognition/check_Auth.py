import cv2
import torch
import numpy as np
import pickle
from facenet_pytorch import MTCNN, InceptionResnetV1

# Load stored embeddings
with open("face_embeddings.pkl", "rb") as f:
    embeddings_dict = pickle.load(f)

# Initialize MTCNN and FaceNet
mtcnn = MTCNN(keep_all=True)
facenet = InceptionResnetV1(pretrained='vggface2').eval()

# Capture webcam image
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Error: Could not access webcam.")
    exit()

print("📷 Press 's' to capture image...")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Error: Unable to capture frame.")
        break

    cv2.imshow("Live Camera", frame)

    if cv2.waitKey(1) & 0xFF == ord('s'):
        captured_frame = frame.copy()
        cap.release()
        cv2.destroyAllWindows()
        break

# Convert to RGB
captured_frame_rgb = cv2.cvtColor(captured_frame, cv2.COLOR_BGR2RGB)

# Detect face
faces, _ = mtcnn.detect(captured_frame_rgb)

if faces is None:
    print("❌ No face detected. Try again.")
    exit()

# Process detected face
x1, y1, x2, y2 = map(int, faces[0])
face_crop = captured_frame_rgb[y1:y2, x1:x2]

# Resize to FaceNet input size
face_crop = cv2.resize(face_crop, (160, 160))
face_crop = torch.tensor(face_crop).permute(2, 0, 1).float().unsqueeze(0) / 255.0

# Compute embedding
with torch.no_grad():
    captured_embedding = facenet(face_crop).numpy()

# Compare with stored embeddings (cosine similarity)
def cosine_similarity(emb1, emb2):
    return np.dot(emb1, emb2.T) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

best_match = None
best_score = 0
THRESHOLD = 0.6  # Adjust as needed

for filename, stored_embedding in embeddings_dict.items():
    score = cosine_similarity(captured_embedding, stored_embedding)

    if score > best_score:
        best_score = score
        best_match = filename

# Authentication Result
if best_score > THRESHOLD:
    print(f"✅ Authentication Successful! Matched with {best_match} (Similarity: {best_score.item():.2f})")
else:
    print("❌ Authentication Failed.")
