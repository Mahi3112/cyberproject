import torch
import cv2
import os
import numpy as np
from facenet_pytorch import MTCNN, InceptionResnetV1
import pickle

# Initialize face detector (MTCNN) and FaceNet model
mtcnn = MTCNN(keep_all=True)
facenet = InceptionResnetV1(pretrained='vggface2').eval()

REFERENCE_FOLDER = "/home/daksh/PycharmProjects/PythonProject4/Ref_images"
embeddings_dict = {}

for filename in os.listdir(REFERENCE_FOLDER):
    img_path = os.path.join(REFERENCE_FOLDER, filename)
    image = cv2.imread(img_path)

    if image is None:
        print(f"Skipping {filename}, could not be read.")
        continue

    # Convert to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Detect face
    faces, _ = mtcnn.detect(image_rgb)

    if faces is not None:
        for face in faces:
            x1, y1, x2, y2 = map(int, face)
            face_crop = image_rgb[y1:y2, x1:x2]

            # Resize to FaceNet input size
            face_crop = cv2.resize(face_crop, (160, 160))
            face_crop = torch.tensor(face_crop).permute(2, 0, 1).float().unsqueeze(0) / 255.0

            # Compute embedding
            with torch.no_grad():
                embedding = facenet(face_crop).numpy()

            embeddings_dict[filename] = embedding

# Save embeddings
with open("face_embeddings.pkl", "wb") as f:
    pickle.dump(embeddings_dict, f)

print(f"✅ Face embeddings saved for {len(embeddings_dict)} images.")
