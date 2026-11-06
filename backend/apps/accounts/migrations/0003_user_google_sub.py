from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_superusers_are_admins'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='google_sub',
            field=models.CharField(blank=True, default=None, max_length=255, null=True, unique=True),
        ),
    ]
