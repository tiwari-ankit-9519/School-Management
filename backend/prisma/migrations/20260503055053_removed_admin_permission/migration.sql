/*
Warnings:

- You are about to drop the `AdminPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdminPermission"
DROP CONSTRAINT "AdminPermission_adminId_fkey";

-- DropTable
DROP TABLE "AdminPermission";

DROP TRIGGER IF EXISTS trg_assign_admin_reg ON "User";

DROP FUNCTION IF EXISTS trg_fn_assign_admin_reg ();

DROP TRIGGER IF EXISTS trg_assign_moderator_reg ON "User";

DROP FUNCTION IF EXISTS trg_fn_assign_moderator_reg ();

DROP TRIGGER IF EXISTS trg_assign_teacher_reg ON "Teacher";

DROP FUNCTION IF EXISTS trg_fn_assign_teacher_reg ();

DROP TRIGGER IF EXISTS trg_assign_student_reg ON "Student";

DROP FUNCTION IF EXISTS trg_fn_assign_student_reg ();

DROP TRIGGER IF EXISTS trg_assign_parent_reg ON "Parent";

DROP FUNCTION IF EXISTS trg_fn_assign_parent_reg ();