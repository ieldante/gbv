import { getCourseCatalog } from "@/lib/data";

export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    courses: getCourseCatalog(),
  });
}
