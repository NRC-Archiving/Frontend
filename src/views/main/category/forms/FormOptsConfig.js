import api from '@/api/document.api';
import { useToastStore } from '@/store/toastStore';
import { mapActions } from 'pinia';

export default {
    props: {
        mode: {
            type: String,
            default: 'create',
            validator: (value) => ['create', 'edit'].includes(value),
        },
        docId: {
            type: String,
            required: false,
        },
        filename: {
            type: String,
            required: false,
        },
    },
    data() {
        return {
            localPreview: null,
            selectedFile: null,
            loading: false,
            error: false,
            role: localStorage.getItem('role'),
            attributeStatus: {},
            additionalFiles: []
        };
    },
    methods: {
        ...mapActions(useToastStore, {
            setToast: 'setToast',
        }),
        async handleUpdate() {
            Object.keys(this.attributeStatus).forEach(key => {
                this.attributeStatus[key] = true;
            })
            this.docData['notes'] = JSON.stringify(this.attributeStatus);
            this.axios(api.updateDocData(this.docData, this.docType, this.docId))
                .then((response) => {
                    if (response.status === 200) {
                        this.setToast('', 'Dokumen berhasil disimpan', 3000);
                        this.$router.back();
                    } else {
                        this.setToast('', 'Dokumen gagal disimpan', 3000);
                    }
                })
                .catch((err) => {
                    console.error('Error:', err);
                });
        },
        // async handleSubmit(file) {
        //     if (this.isRequiredFormEmpty) {
        //         this.setToast('', 'Form ada yang perlu diisi', 3000);
        //     } else {
        //         this.uploadFile(file);
        //     }
        // },
        // async uploadFile(file) {
        //     if (!file) {
        //         alert('Tidak ada file yang dipilih.');
        //         return;
        //     }

        //     this.loading = true;
        //     this.axios(api.upload(file, this.docType))
        //         .then(async (response) => {
        //             if (response.status === 200) {
        //                 const body = response.data;
        //                 const data = {
        //                     docName: body.data.file.filename,
        //                     fileRef: [body.data.file._id],
        //                     docType: body.data.file.documentType,
        //                     ...this.docData,
        //                 };
        //                 this.selectedFile = null;
        //                 await this.uploadDocument(data);
        //             } else {
        //                 console.error('File gagal diunggah.');
        //             }
        //         })
        //         .catch((error) => {
        //             console.error('Error:', error);
        //         })
        //         .finally(() => {
        //             this.loading = false;
        //         });
        // },
        // async uploadDocument(data) {
        //     this.axios(api.uploadDocData(data, data.docType))
        //         .then((response) => {
        //             if (response.status === 200) {
        //                 this.setToast('', 'Dokumen berhasil diunggah.', 3000);
        //             } else {
        //                 console.error('Dokumen gagal diunggah.');
        //             }
        //         })
        //         .catch((error) => {
        //             console.error('Error:', error);
        //         });
        // },
        async fetchData() {
            if (this.docId) {
                this.axios(api.getDocData(this.docId))
                    .then((response) => {
                        if (response.status === 200) {
                            const body = response.data;
                            Object.keys(this.docData).forEach((key) => {
                                if (body.data.hasOwnProperty(key)) {
                                    this.docData[key] = body.data[key];
                                }
                            });
                            if (body.data.notes) {
                                this.attributeStatus = JSON.parse(body.data.notes);
                            } else {
                                this.attributeStatus = JSON.parse(JSON.stringify(this.docData));
                                Object.keys(this.attributeStatus).forEach(key => {
                                    this.attributeStatus[key] = true;
                                });
                            }
                            this.fetchFile(body.data.docName);
                        } else {
                            console.error('Dokumen gagal diambil.');
                        }
                    })
                    .catch((err) => {
                        console.error('Error:', err);
                    });
            }
        },
        async fetchFile(filename) {
            this.error = false;
            this.axios(api.getPdf(filename))
                .then((response) => {
                    if (response.status === 200) {
                        this.localPreview = URL.createObjectURL(response.data);
                        this.error = false;
                    } else {
                        console.error('File gagal diambil.');
                        this.localPreview = null;
                        this.error = true;
                    }
                })
                .catch((err) => {
                    console.error('Error:', err);
                    this.error = true;
                });
        },
        async handleUpload() {
            if (this.isRequiredFormEmpty) {
                this.setToast('', 'Ada form yang perlu diisi', 3000);
            } else {
                if (this.selectedFile) {
                    this.loading = true;

                    this.axios(api.uploadAll(this.selectedFile, this.additionalFiles, this.docType))
                    .then(async response => {
                        const body = response.data;

                        if (response.status == 200) {
                            this.setToast('', 'Dokumen berhasil diunggah.', 3000);
                            const file = body.data.file;
                            // console.log(file);

                            const formData = {
                                docName: file.filename,
                                fileRef: [file._id],
                                docType: file.documentType,
                                notes: '',
                                ...this.docData,
                            }
                            await this.uploadFormData(formData); 
                        } else {
                            console.log('Dokumen gagal diunggah');
                        }
                    })
                    .catch(err => {
                        console.log('Error', err);
                    })
                    .finally(() => {
                        this.loading = false;
                    })
                } else {
                    alert('Tidak ada file yang dipilih');
                }
            }
        },
        async uploadFormData(data) {
            this.axios(api.uploadDocData(data, data.docType, true))
            .then((response) => {
                const body = response.data;

                if (response.status === 200) {
                    this.setToast('', 'Dokumen berhasil diunggah.', 3000);
                    console.log(body);
                } else {
                    console.error('Dokumen gagal diunggah.');
                }
            })
            .catch((err) => {
                console.error('Error:', err);
            });
        },
        setAttributesNull() {    
            if (this.mode == 'create') {
                this.attributeStatus = JSON.parse(JSON.stringify(this.docData));
                Object.keys(this.attributeStatus).forEach(key => {
                    this.attributeStatus[key] = true;
                });
            }
        },
    },
    beforeUnmount() {
        if (this.localPreview) {
            URL.revokeObjectURL(this.localPreview);
        }
    },
};
